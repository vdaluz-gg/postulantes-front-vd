import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../../../shared/ui/atoms/icon/icons';

/**
 * Botón redondo solo con ícono. `label` es obligatorio: es lo que lee el lector de pantalla y
 * lo que aparece al pasar el mouse.
 */
@Component({
  selector: 'button[boIconButton]',
  imports: [IconComponent],
  templateUrl: './bo-icon-button.component.html',
  styleUrl: './bo-icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'label()',
    '[class.sm]': 'size() === "sm"',
    '[class.on]': 'pressed()',
    '[attr.aria-pressed]': 'pressed() ?? null',
  },
})
export class BoIconButtonComponent {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly size = input<'md' | 'sm'>('md');
  /** Para botones que alternan un estado (visible / oculto). */
  readonly pressed = input<boolean | undefined>(undefined);
}
