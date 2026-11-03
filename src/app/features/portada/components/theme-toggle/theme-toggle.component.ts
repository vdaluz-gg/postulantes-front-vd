import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

/** Interruptor de tema de la portada: un solo botón con sol, luna e indicador deslizante. */
@Component({
  selector: 'button[appThemeToggle]',
  imports: [IconComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    role: 'switch',
    title: 'Cambiar tema',
    '[attr.aria-checked]': 'dark()',
    '[attr.aria-label]': 'dark() ? "Cambiar a modo claro" : "Cambiar a modo oscuro"',
    '[class.light]': '!dark()',
    '(click)': 'theme.toggle()',
  },
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly dark = computed(() => this.theme.theme() === 'dark');
}
