import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

let nextId = 0;

/**
 * Campo de texto con etiqueta, ayuda y error asociados por aria-describedby.
 * El valor es bidireccional: `[(value)]`.
 */
@Component({
  selector: 'bo-text-field',
  templateUrl: './bo-text-field.component.html',
  styleUrl: './bo-text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()' },
})
export class BoTextFieldComponent {
  readonly label = input.required<string>();
  readonly value = model('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'date' | 'url' | 'tel'>('text');
  readonly multiline = input(false);
  readonly rows = input(3);
  readonly placeholder = input('');
  readonly help = input('');
  readonly error = input('');
  readonly required = input(false);
  readonly autocomplete = input('off');
  readonly inputmode = input<string | null>(null);
  /** Etiqueta solo para lectores de pantalla (cuando el contexto ya la muestra). */
  readonly hideLabel = input(false);
  /** Versión más baja para el panel de propiedades. */
  readonly compact = input(false);
  readonly blurred = output<void>();

  readonly inputId = `bo-tf-${nextId++}`;
  protected readonly describedBy = computed(
    () =>
      [this.help() && `${this.inputId}-help`, this.error() && `${this.inputId}-err`]
        .filter(Boolean)
        .join(' ') || null,
  );

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
