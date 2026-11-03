import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

/**
 * Ícono SVG decorativo. Se aplica sobre un <svg> para no agregar nodos extra:
 * <svg appIcon="check"></svg>
 * Si el ícono transmite información por sí solo, el elemento que lo contiene debe tener aria-label.
 */
@Component({
  selector: 'svg[appIcon]',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ic',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    '[class.filled]': 'filled()',
    '[class.flip]': 'flip()',
  },
})
export class IconComponent {
  readonly appIcon = input.required<IconName>();
  /** Relleno sólido en lugar de trazo. */
  readonly filled = input(false);
  /** Espejo horizontal (por ejemplo, flecha de "volver"). */
  readonly flip = input(false);

  protected readonly path = computed(() => ICONS[this.appIcon()]);
}
