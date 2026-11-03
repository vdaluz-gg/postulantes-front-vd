import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Botón redondo de 44 px solo con ícono. El nombre accesible es obligatorio (label).
 * <button appIconButton label="Mensajes" [dot]="true"><svg appIcon="bell"></svg></button>
 */
@Component({
  selector: 'button[appIconButton], a[appIconButton]',
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ib',
    '[attr.aria-label]': 'label()',
  },
})
export class IconButtonComponent {
  readonly label = input.required<string>();
  /** Punto de aviso (por ejemplo, mensajes sin leer). */
  readonly dot = input(false);
}
