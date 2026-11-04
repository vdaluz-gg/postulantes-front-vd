import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiPromptComponent } from '../ai-prompt/ai-prompt.component';
import { ApplicationTrackerComponent } from '../peek/application-tracker/application-tracker.component';
import { NearbyMapComponent } from '../peek/nearby-map/nearby-map.component';
import { PeekPanelComponent } from '../peek/peek-panel/peek-panel.component';
import { WhatsappPreviewComponent } from '../peek/whatsapp-preview/whatsapp-preview.component';
import { PortadaButtonComponent } from '../portada-button/portada-button.component';
import { SuggestionPillComponent } from '../suggestion-pill/suggestion-pill.component';
import { TopicChipComponent } from '../topic-chip/topic-chip.component';
import { Persona, PersonaChip } from '../../portada.data';

/**
 * Panel de información de un perfil: titular, consulta a la IA, sugerencias, temas con vista
 * previa y acciones. Al pasar el cursor o enfocar un tema se muestra su vista previa; al tocarlo
 * queda fija hasta tocar otro.
 */
@Component({
  selector: 'app-persona-panel',
  imports: [
    RouterLink,
    AiPromptComponent,
    ApplicationTrackerComponent,
    NearbyMapComponent,
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

  protected readonly query = linkedSignal(() => this.initialQuery());
  /** Tema elegido: al abrir, el primero que tenga vista previa. */
  protected readonly activeChipId = linkedSignal<Persona, string | null>({
    source: this.persona,
    computation: (persona) => persona.chips.find((c) => c.peek)?.id ?? null,
  });
  /** Un tema tocado queda fijo: pasar por otros ya no cambia la vista previa. */
  private readonly pinned = linkedSignal<Persona, boolean>({ source: this.persona, computation: () => false });

  protected readonly activeChip = computed(
    () => this.persona().chips.find((c) => c.id === this.activeChipId()) ?? null,
  );
  protected readonly hasPeeks = computed(() => this.persona().chips.some((c) => c.peek));
  protected readonly peekId = computed(() => `peek-${this.persona().id}`);
  protected readonly shown = signal(false);

  private readonly prompt = viewChild.required(AiPromptComponent);

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.shown.set(true)));
  }

  protected useSuggestion(text: string): void {
    this.query.set(text);
    this.prompt().focus();
  }

  /** Vista previa al pasar el cursor o enfocar un tema (si no hay uno fijado). */
  protected preview(chip: PersonaChip): void {
    if (!this.pinned() && chip.peek) this.activeChipId.set(chip.id);
  }

  protected pin(chip: PersonaChip): void {
    this.activeChipId.set(chip.id);
    this.pinned.set(true);
  }
}
