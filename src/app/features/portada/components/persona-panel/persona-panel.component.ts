import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiPromptComponent } from '../ai-prompt/ai-prompt.component';
import { Persona } from '../../portada.data';

/**
 * Panel de información de un perfil: titular, consulta a la IA, sugerencias, temas y acciones.
 * Los elementos entran escalonados al montarse.
 */
@Component({
  selector: 'app-persona-panel',
  imports: [RouterLink, AiPromptComponent],
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
  protected readonly activeChip = linkedSignal<Persona, string | null>({
    source: this.persona,
    computation: () => null,
  });
  protected readonly shown = signal(false);

  private readonly prompt = viewChild.required(AiPromptComponent);

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.shown.set(true)));
  }

  protected useSuggestion(text: string): void {
    this.query.set(text);
    this.prompt().focus();
  }

  protected toggleChip(chip: string): void {
    this.activeChip.update((current) => (current === chip ? null : chip));
  }
}
