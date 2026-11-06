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
import { COLLABORATOR_PHONE, Receipt, readCertificate, topicForQuestion } from '../../colaboradores/collaborator-data';
import { ADVISOR_PHONE, CompanyService, draftProposal, recommendService, serviceById } from '../../empresas/company-services';
import { ProposalFormComponent } from '../../empresas/proposal-form/proposal-form.component';
import { CertificateDropComponent } from '../peek/certificate-drop/certificate-drop.component';
import { PaydayCardComponent } from '../peek/payday-card/payday-card.component';
import { ReceiptListComponent } from '../peek/receipt-list/receipt-list.component';
import { ServicePreviewComponent } from '../peek/service-preview/service-preview.component';
import { ToastService } from '../toast/toast.service';
import { PortadaConfig } from '../../published-config';

/** Pausas con las que la IA "piensa" (maqueta): ofertas y empresas, legajo, certificado. */
const SEARCH_THINK_MS = 900;
const LEDGER_THINK_MS = 800;
const CERTIFICATE_READ_MS = 1300;

/**
 * Panel de información de un perfil: titular, consulta a la IA, sugerencias, temas con vista
 * previa y acciones.
 * - Postulantes: las sugerencias, el buscador y "Ver todas las ofertas" muestran ofertas
 *   relacionadas; cada oferta abre su detalle; "Dejar mi CV con IA" y "Postularme" llevan al
 *   formulario de contacto que completa la IA.
 * - Empresas: la IA recomienda un servicio para la consulta y arma la propuesta para un asesor.
 * - Colaboradores: la IA responde desde el legajo (cobro, recibos, certificados, tarjeta).
 * Empresas y colaboradores usan datos de ejemplo.
 */
/** Foto o PDF, como acepta la carga del certificado. */
const isCertificateFile = (file: File): boolean => file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

@Component({
  selector: 'app-persona-panel',
  imports: [
    RouterLink,
    AiPromptComponent,
    AiThinkingComponent,
    ApplicationSentComponent,
    ApplicationTrackerComponent,
    CandidateFormComponent,
    CertificateDropComponent,
    CvUploadComponent,
    NearbyMapComponent,
    OfferDetailComponent,
    OfferResultsComponent,
    PaydayCardComponent,
    PeekPanelComponent,
    PortadaButtonComponent,
    ProposalFormComponent,
    ReceiptListComponent,
    ServicePreviewComponent,
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
  private readonly toast = inject(ToastService);

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
  protected readonly serviceById = serviceById;

  /** Pasos con más contenido: el recuadro crece y se desplaza por dentro. */
  protected fits(step: PanelFlow): boolean {
    return ['results', 'form', 'cv', 'recommend', 'proposal', 'proposal-sent'].includes(step.kind);
  }

  protected headingOf(step: PanelFlow): string | null {
    switch (step.kind) {
      case 'cv':
        return 'Dejá tu CV con IA';
      case 'form':
        return step.heading;
      case 'proposal':
        return 'Propuesta armada por la IA';
      case 'shortcuts':
        return 'Gestión Virtual';
      case 'app':
        return 'La app de Gestión Virtual';
      default:
        return null;
    }
  }
  /** Recibos firmados en esta visita. */
  protected readonly signed = signal<ReadonlySet<string>>(new Set());
  /** Empresas: última consulta y servicio recomendado, para armar la propuesta. */
  private readonly companyQuery = linkedSignal<Persona, string>({ source: this.persona, computation: () => '' });
  private readonly recommended = linkedSignal<Persona, CompanyService | null>({ source: this.persona, computation: () => null });
  protected readonly shown = signal(false);

  private readonly peekSlot = viewChild<ElementRef<HTMLElement>>('peekSlot');
  private readonly injector = inject(Injector);
  private pending?: Subscription;

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.shown.set(true)));
    inject(DestroyRef).onDestroy(() => this.cancelPending());
  }

  /** Sugerencias dinámicas: cada una responde como si se la hubiera escrito. */
  protected useSuggestion(text: string): void {
    this.query.set(text);
    this.ask(text);
  }

  /** Consulta a la IA: ofertas para postulantes, servicio para empresas, legajo para colaboradores. */
  protected ask(query: string): void {
    switch (this.persona().id) {
      case 'post':
        this.search(query);
        break;
      case 'cli':
        this.recommend(query.trim() || '40 operarios para un pico de producción');
        break;
      case 'col':
        this.answer(query.trim() || '¿Cuándo cobro?');
        break;
    }
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

  /** Empresas: recomienda el servicio que mejor responde a la necesidad y lo deja marcado. */
  private recommend(query: string): void {
    this.go({ kind: 'thinking', text: 'La IA analiza tu necesidad…' });
    this.pending = timer(this.think(SEARCH_THINK_MS)).subscribe(() => {
      const service = recommendService(query);
      this.companyQuery.set(query);
      this.recommended.set(service);
      this.activeChipId.set(service.id);
      this.go({ kind: 'recommend', query, service });
    });
  }

  /** Empresas: la IA arma la propuesta con la consulta y el servicio recomendado (o el tema abierto). */
  private propose(): void {
    const service = this.recommended() ?? serviceById(this.activeChipId() ?? '');
    const query = this.companyQuery() || this.query().trim() || 'cubrir personal';
    this.go({ kind: 'proposal', rows: draftProposal(query, service) });
  }

  protected sendProposal(): void {
    const service = this.recommended() ?? serviceById(this.activeChipId() ?? '');
    this.go({ kind: 'proposal-sent', service });
    this.toast.show('Propuesta enviada ✓');
  }

  /** Colaboradores: busca la respuesta en el legajo y abre el tema; si no la encuentra, deriva a atención. */
  private answer(question: string): void {
    this.go({ kind: 'thinking', text: 'La IA busca en tu legajo…' });
    this.pending = timer(this.think(LEDGER_THINK_MS)).subscribe(() => {
      const topic = topicForQuestion(question);
      if (topic) {
        this.activeChipId.set(topic);
        this.pinned.set(true);
        this.go({ kind: 'topic' });
        return;
      }
      this.go({
        kind: 'say',
        parts: [
          { text: 'No encontré eso en tu legajo, pero te ayudo igual: llamá a ' },
          { text: 'Atención al colaborador', strong: true },
          { text: ` al ${COLLABORATOR_PHONE} o escribinos por WhatsApp.` },
        ],
      });
    });
  }

  protected signReceipt(receipt: Receipt): void {
    this.signed.update((set) => new Set([...set, receipt.id]));
    this.toast.show('Recibo firmado ✓');
  }

  /** Colaboradores: la IA "lee" el certificado (es un ejemplo: el archivo no sale del navegador). */
  protected uploadCertificate(file: File): void {
    if (!isCertificateFile(file)) {
      this.go({
        kind: 'say',
        parts: [{ text: 'Ese archivo no es una foto ni un PDF. ' }, { text: 'Sacale una foto al certificado', strong: true }, { text: ' o subilo en PDF.' }],
      });
      return;
    }
    this.go({ kind: 'thinking', text: 'La IA está leyendo tu certificado…' });
    this.pending = timer(this.think(CERTIFICATE_READ_MS)).subscribe(() => {
      this.go({
        kind: 'say',
        parts: [
          { text: 'Certificado cargado.', strong: true },
          { text: ' La IA lo reconoció como ' },
          { text: readCertificate(new Date()), strong: true },
          { text: ' y ya lo vio tu supervisor.' },
        ],
      });
      this.toast.show('Certificado cargado ✓');
    });
  }

  protected sendAppLink(): void {
    this.toast.show('Te mandamos el enlace por WhatsApp ✓');
  }

  private think(ms: number): number {
    return this.motion.reduced() ? 0 : ms;
  }

  protected pin(chip: PersonaChip): void {
    this.activeChipId.set(chip.id);
    this.pinned.set(true);
    // Empresas: elegir un servicio a mano reemplaza la recomendación anterior para la propuesta.
    this.recommended.set(null);
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
      case 'proposal':
        this.propose();
        break;
      case 'advisor':
        this.toast.show(`Un asesor te contacta hoy · ${ADVISOR_PHONE}`);
        break;
      case 'virtual':
        this.go({ kind: 'shortcuts' });
        break;
      case 'app':
        this.go({ kind: 'app' });
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
