import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  ApplicationsApi,
  DocumentsApi,
  InterviewsApi,
  JobsApi,
  MessagesApi,
  ProfileApi,
} from '../../../core/data-access/postulante.apis';
import {
  Application,
  CandidateDocument,
  CandidateProfile,
  InboxMessage,
  Interview,
  JobOpening,
  MIN_OFFER_MATCH,
  firstName,
  initials,
  isActiveApplication,
  isMissingRequired,
  isUpcoming,
  profileCompleteness,
  toOffer,
} from '../../../core/models';
import { SessionService } from '../../../core/services/session.service';

/** Cada cuánto se recalculan los datos que dependen de la hora (próximas reuniones, cuenta regresiva). */
const CLOCK_MS = 30_000;

/**
 * Estado del portal del postulante: datos del backend (hoy mocks) y lo que se deriva de ellos
 * para las vistas (contadores, próxima entrevista, pendientes). Las vistas leen signals y
 * modifican el estado solo a través de los métodos de acción.
 */
@Injectable({ providedIn: 'root' })
export class PostulanteStore {
  private readonly profileApi = inject(ProfileApi);
  private readonly applicationsApi = inject(ApplicationsApi);
  private readonly interviewsApi = inject(InterviewsApi);
  private readonly documentsApi = inject(DocumentsApi);
  private readonly messagesApi = inject(MessagesApi);
  private readonly jobsApi = inject(JobsApi);
  private readonly session = inject(SessionService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private clock?: ReturnType<typeof setInterval>;

  /** Hora de referencia para todo lo relativo ("en 3 días", próximas reuniones). */
  readonly now = signal(Date.now());
  readonly loaded = signal(false);

  readonly profile = signal<CandidateProfile | null>(null);
  readonly applications = signal<Application[]>([]);
  readonly interviews = signal<Interview[]>([]);
  readonly documents = signal<CandidateDocument[]>([]);
  readonly messages = signal<InboxMessage[]>([]);
  readonly jobs = signal<JobOpening[]>([]);

  readonly email = this.session.email;
  readonly fullName = computed(() => this.profile()?.name ?? '');
  readonly firstName = computed(() => firstName(this.fullName()));
  readonly initials = computed(() => initials(this.fullName()));

  readonly activeApplications = computed(() => this.applications().filter(isActiveApplication));
  readonly upcomingInterviews = computed(() =>
    this.interviews()
      .filter((i) => isUpcoming(i, this.now()))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
  );
  /** La próxima reunión con una persona; si no hay, la próxima con el agente. */
  readonly nextInterview = computed(
    () => this.upcomingInterviews().find((i) => i.type === 'recruiter') ?? this.upcomingInterviews()[0] ?? null,
  );
  readonly pendingInterview = computed(() => this.interviews().find((i) => i.status === 'pending') ?? null);
  readonly applicationAwaitingAgent = computed(() => this.applications().find((a) => a.stage === 2) ?? null);
  readonly missingDocuments = computed(() => this.documents().filter(isMissingRequired));
  readonly unreadCount = computed(() => this.messages().filter((m) => m.unread).length);
  readonly offers = computed(() => {
    const applied = new Set(this.applications().map((a) => a.jobId));
    return this.jobs()
      .filter((j) => !applied.has(j.id) && j.match >= MIN_OFFER_MATCH)
      .map(toOffer);
  });
  readonly completeness = computed(() => {
    const profile = this.profile();
    return profile ? profileCompleteness(profile, this.email()) : 0;
  });

  /** Carga todos los datos del portal una sola vez por sesión. */
  load(): void {
    if (this.loaded()) return;
    forkJoin({
      profile: this.profileApi.get(),
      applications: this.applicationsApi.list(),
      interviews: this.interviewsApi.list(),
      documents: this.documentsApi.list(),
      messages: this.messagesApi.list(),
      jobs: this.jobsApi.catalog(),
    }).subscribe((data) => {
      this.profile.set(data.profile);
      this.applications.set(data.applications);
      this.interviews.set(data.interviews);
      this.documents.set(data.documents);
      this.messages.set(data.messages);
      this.jobs.set(data.jobs);
      this.loaded.set(true);
    });
    this.startClock();
  }

  /** Vacía el estado al cerrar sesión, para que otra persona no vea los datos anteriores. */
  reset(): void {
    this.profile.set(null);
    this.applications.set([]);
    this.interviews.set([]);
    this.documents.set([]);
    this.messages.set([]);
    this.jobs.set([]);
    this.loaded.set(false);
  }

  application(id: string): Application | undefined {
    return this.applications().find((a) => a.id === id);
  }

  /** Confirma una reunión pendiente y lo registra en el historial de su postulación. */
  confirmInterview(id: string): void {
    const interview = this.interviews().find((i) => i.id === id);
    if (!interview) return;
    this.interviewsApi.confirm(id).subscribe(() => {
      this.interviews.update((list) => list.map((i) => (i.id === id ? { ...i, status: 'confirmed' } : i)));
      this.applications.update((list) =>
        list.map((a) =>
          a.id === interview.applicationId
            ? {
                ...a,
                status: 'Entrevista confirmada',
                history: [...a.history, { at: new Date(this.now()), text: 'Confirmaste la reunión.' }],
              }
            : a,
        ),
      );
    });
  }

  interview(id: string): Interview | undefined {
    return this.interviews().find((i) => i.id === id);
  }

  /** Pide otro horario para una reunión y lo registra en el historial de su postulación. */
  requestReschedule(id: string, slot: Date, reason = ''): void {
    const interview = this.interview(id);
    if (!interview) return;
    this.interviewsApi.requestReschedule(id, slot, reason).subscribe(() => {
      this.interviews.update((list) =>
        list.map((i) => (i.id === id ? { ...i, status: 'reschedule-requested', rescheduleRequestedFor: slot } : i)),
      );
      this.applications.update((list) =>
        list.map((a) =>
          a.id === interview.applicationId
            ? {
                ...a,
                status: 'Reprogramación pedida',
                history: [...a.history, { at: new Date(this.now()), text: 'Pediste cambiar el horario de la reunión.' }],
              }
            : a,
        ),
      );
    });
  }

  private startClock(): void {
    if (!this.isBrowser || this.clock) return;
    this.clock = setInterval(() => this.now.set(Date.now()), CLOCK_MS);
    this.destroyRef.onDestroy(() => clearInterval(this.clock));
  }
}
