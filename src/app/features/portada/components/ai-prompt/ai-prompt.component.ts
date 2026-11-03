import { ChangeDetectionStrategy, Component, ElementRef, input, model, output, viewChild } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { PersonaPrompt } from '../../portada.data';

/** Caja de consulta a la IA: etiqueta "IA", campo de texto y botón de envío. */
@Component({
  selector: 'app-ai-prompt',
  imports: [IconComponent],
  templateUrl: './ai-prompt.component.html',
  styleUrl: './ai-prompt.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPromptComponent {
  readonly prompt = input.required<PersonaPrompt>();
  readonly inputId = input.required<string>();
  readonly value = model('');
  /** Se emite con el texto ya recortado; nunca vacío. */
  readonly submitted = output<string>();

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  focus(): void {
    this.control().nativeElement.focus();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const query = this.value().trim();
    if (query) this.submitted.emit(query);
    else this.focus();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
