import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, timer } from 'rxjs';
import { MotionService } from '../../../../core/services/motion.service';
import { errorMessage } from '../../../../core/api/api';
import { ApplicationTarget, CandidacyApi, CandidateContact } from '../../postulante/candidacy.api';
import { AiThinkingComponent } from '../../postulante/components/ai-thinking/ai-thinking.component';
import { ApplicationSentComponent } from '../../postulante/components/application-sent/application-sent.component';
import { CandidateFormComponent } from '../../postulante/components/candidate-form/candidate-form.component';
import { CvUploadComponent } from '../../postulante/components/cv-upload/cv-upload.component';
import { OfferDetailComponent } from '../../postulante/components/offer-detail/offer-detail.component';
import { OfferResultsComponent } from '../../postulante/components/offer-results/offer-results.component';
import { JobPosting } from '../../postulante/job-offer';
import { searchJobs } from '../../postulante/job-search';
import { OffersApi } from '../../postulante/offers.api';
import { PanelFlow, SPONTANEOUS_POSITION } from '../../postulante/panel-flow';
import { AiPromptComponent } from '../ai-prompt/ai-prompt.component';
import { ApplicationTrackerComponent } from '../peek/application-tracker/application-tracker.component';
import { NearbyMapComponent } from '../peek/nearby-map/nearby-map.component';
import { PeekPanelComponent } from '../peek/peek-panel/peek-panel.component';
import { WhatsappPreviewComponent } from '../peek/whatsapp-preview/whatsapp-preview.component';
import { PortadaButtonComponent } from '../portada-button/portada-button.component';
import { SuggestionPillComponent } from '../suggestion-pill/suggestion-pill.component';
import { TopicChipComponent } from '../topic-chip/topic-chip.component';
import { PanelCommand, Persona, PersonaChip } from '../../portada.data';
import { PortadaConfig } from '../../published-config';

/** Pausa con la que la IA "piensa" antes de mostrar las ofertas (maqueta). */
const SEARCH_THINK_MS = 900;

/**
 * Panel de información de un perfil: titular, consulta a la IA, sugerencias, temas con vista
 * previa y acciones. Las sugerencias, el buscador y "Ver todas las ofertas" muestran ofertas
 * relacionadas; cada oferta abre su detalle; "Dejar mi CV con IA" y "Postularme" llevan al
 * formulario de contacto que completa la IA.
 */
@Component({
  selector: 'app-persona-panel',
  imports: [
    RouterLink,
    AiPromptComponent,
    AiThinkingComponent,
    ApplicationSentComponent,
    ApplicationTrackerComponent,
    CandidateFormComponent,
    CvUploadComponent,
    NearbyMapComponent,
    OfferDetailComponent,
    OfferResultsComponent,
    PeekPanelComponent,
    PortadaButtonComponent,
    SuggestionPillComponent,
    TopicChipComponent,
    WhatsappPreviewComponent,
  ],
  templateUrl: './persona-panel.component.html',
  styleUrl: './persona-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.on]': 'shown()',
    '[style.--acc]': '"var(--c-" + persona().id + ")"',
  },
})
export class PersonaPanelComponent {
  readonly persona = input.required<Persona>();
  /** Consulta que trajo a la persona hasta acá desde la caja de la portada. */
  readonly initialQuery = input('');

  private readonly candidacy = inject(CandidacyApi);
  private readonly offers = inject(OffersApi);
  private readonly motion = inject(MotionService);
  private readonly config = inject(PortadaConfig);

  /** Campos del formulario de postulación que publicó el backoffice. */
  protected readonly applicationFields = this.config.applicationFields;
  /** Avisos publicados para postulantes (activos y en fecha). */
  protected readonly alerts = this.config.alerts;

  protected readonly query = linkedSignal(() => this.initialQuery());
  /** Tema elegido: al abrir, el primero que tenga vista previa. */
  protected readonly activeChipId = linkedSignal<Persona, string | null>({
    source: this.persona,
    computation: (persona) => persona.chips.find((c) => c.peek)?.id ?? null,
  });
  /** Un tema tocado queda fijo: pasar por otros ya no cambia la vista previa. */
  private readonly pinned = linkedSignal<Persona, boolean>({ source: this.persona, computation: () => false });

  protected readonly flow = linkedSignal<Persona, PanelFlow>({ source: this.persona, computation: () => ({ kind: 'topic' }) });
  /** Cambia con cada paso del flujo para repetir la entrada del recuadro. */
  protected readonly flowKey = signal(0);
  /** Oferta abierta en detalle (reemplaza la vista principal del panel). */
  protected readonly detail = signal<JobPosting | null>(null);

  protected readonly activeChip = computed(
    () => this.persona().chips.find((c) => c.id === this.activeChipId()) ?? null,
  );
  protected readonly showsPeek = computed(
    () => this.flow().kind !== 'topic' || this.persona().chips.some((c) => c.peek),
  );
  protected readonly peekId = computed(() => `peek-${this.persona().id}`);
  protected readonly shown = signal(false);

  private readonly peekSlot = viewChild<ElementRef<HTMLElement>>('peekSlot');
  private readonly injector = inject(Injector);
  private pending?: Subscription;

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.shown.set(true)));
    inject(DestroyRef).onDestroy(() => this.cancelPending());
  }

  /** Sugerencias dinámicas: cada una muestra las ofertas relacionadas. */
  protected useSuggestion(text: string): void {
    this.query.set(text);
    this.search(text);
  }

  /** Busca en las ofertas publicadas; espera a la vez la carga y la pausa en la que "piensa" la IA. */
  protected search(query: string): void {
    this.go({ kind: 'thinking', text: 'La IA cruza tu perfil con las ofertas…' });
    this.pending = forkJoin([this.offers.list(), timer(this.motion.reduced() ? 0 : SEARCH_THINK_MS)]).subscribe({
      next: ([offers]) => this.go({ kind: 'results', result: searchJobs(query, offers) }),
      error: () => this.go({ kind: 'notice', text: 'No pudimos cargar las ofertas. Probá de nuevo en un rato.', retry: query }),
    });
  }

  /** Vista previa al pasar el cursor o enfocar un tema (si no hay uno fijado ni otro paso en curso). */
  protected preview(chip: PersonaChip): void {
    if (this.flow().kind === 'topic' && !this.pinned() && chip.peek) this.activeChipId.set(chip.id);
  }

  protected pin(chip: PersonaChip): void {
    this.activeChipId.set(chip.id);
    this.pinned.set(true);
    if (this.flow().kind !== 'topic') this.go({ kind: 'topic' });
  }

  protected run(command: PanelCommand): void {
    switch (command.kind) {
      case 'search':
        this.search(command.useInput ? this.query() : '');
        break;
      case 'cv':
        this.go({ kind: 'cv', position: SPONTANEOUS_POSITION });
        break;
      case 'apply':
        this.go({ kind: 'cv', position: command.position });
        break;
    }
  }

  protected openDetail(job: JobPosting): void {
    this.detail.set(job);
  }

  /** Vuelve a la vista principal con el foco en las ofertas que se estaban mirando. */
  protected closeDetail(): void {
    this.detail.set(null);
    afterNextRender(() => this.peekSlot()?.nativeElement.focus(), { injector: this.injector });
  }

  protected applyTo(job: JobPosting): void {
    this.detail.set(null);
    this.go({ kind: 'cv', position: job.title, offerRef: job.ref });
  }

  protected readCv(file: File, position: string, offerRef?: string): void {
    this.go({ kind: 'thinking', text: 'La IA está leyendo tu CV…' });
    this.pending = this.candidacy.readCv(file).subscribe({
      next: ({ cvId, prefill }) =>
        this.go({
          kind: 'form',
          heading: 'La IA leyó tu CV y completó todo',
          prefill: { ...prefill, position },
          typed: true,
          target: { offerRef, cvId },
        }),
      error: (error: unknown) =>
        this.go({
          kind: 'cv',
          position,
          offerRef,
          error: errorMessage(error, 'No pudimos leer tu CV. Probá de nuevo o completá tus datos a mano.'),
        }),
    });
  }

  protected fillManually(position: string, offerRef?: string): void {
    this.go({ kind: 'form', heading: 'Completá tus datos', prefill: { position }, typed: false, target: { offerRef } });
  }

  protected send(contact: CandidateContact, target: ApplicationTarget): void {
    this.go({ kind: 'thinking', text: 'Enviando tu postulación…' });
    this.pending = this.candidacy.apply(contact, target).subscribe({
      next: (receipt) => this.go({ kind: 'sent', contact, receipt }),
      error: (error: unknown) =>
        this.go({
          kind: 'form',
          heading: 'Revisá tus datos',
          prefill: contact,
          typed: false,
          target,
          error: errorMessage(error, 'No pudimos enviar tu postulación. Probá de nuevo.'),
        }),
    });
  }

  /** Pasa a otro paso del flujo, cancela el anterior y deja visible el recuadro. */
  private go(next: PanelFlow): void {
    this.cancelPending();
    this.flow.set(next);
    this.flowKey.update((k) => k + 1);
    if (next.kind !== 'topic') {
      queueMicrotask(() =>
        this.peekSlot()?.nativeElement.scrollIntoView({ block: 'nearest', behavior: this.motion.reduced() ? 'auto' : 'smooth' }),
      );
    }
  }

  private cancelPending(): void {
    this.pending?.unsubscribe();
  }
}
