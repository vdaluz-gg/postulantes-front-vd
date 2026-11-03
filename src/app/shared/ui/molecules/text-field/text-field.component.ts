import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';

/**
 * Campo de texto con etiqueta asociada. El contenido proyectado se ubica debajo del control
 * (ayudas o mensajes); su id debe pasarse en describedBy para que el lector de pantalla lo anuncie.
 */
@Component({
  selector: 'app-text-field',
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly value = model('');
  readonly type = input<'text' | 'email' | 'tel' | 'search'>('text');
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly maxlength = input<number | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly required = input(false);
  /** Estilo de código de verificación (dígitos grandes y espaciados). */
  readonly code = input(false);
  /** Descarta todo lo que no sea dígito mientras se escribe. */
  readonly digitsOnly = input(false);

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  focus(): void {
    this.control().nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const next = this.digitsOnly() ? el.value.replace(/\D/g, '') : el.value;
    if (next !== el.value) el.value = next;
    this.value.set(next);
  }
}
