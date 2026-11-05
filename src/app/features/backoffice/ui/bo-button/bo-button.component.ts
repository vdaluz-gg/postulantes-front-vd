import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BoButtonVariant = 'pri' | 'sec' | 'ghost' | 'danger';

/** Botón píldora del backoffice: `<button boButton variant="pri">Publicar</button>`. */
@Component({
  selector: 'button[boButton], a[boButton]',
  templateUrl: './bo-button.component.html',
  styleUrl: './bo-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'variant() + " " + size()',
    '[attr.aria-busy]': 'busy() || null',
  },
})
export class BoButtonComponent {
  readonly variant = input<BoButtonVariant>('sec');
  readonly size = input<'md' | 'sm'>('md');
  /** Muestra que la acción está en curso (el texto lo cambia quien lo usa: "Guardando…"). */
  readonly busy = input(false);
}
