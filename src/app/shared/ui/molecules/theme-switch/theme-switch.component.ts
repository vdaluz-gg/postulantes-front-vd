import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Theme, ThemeService } from '../../../../core/services/theme.service';

/** Switch de tema de los portales: dos botones con ícono (sol y luna) y un indicador deslizante. */
@Component({
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.component.html',
  styleUrl: './theme-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', 'aria-label': 'Tema' },
})
export class ThemeSwitchComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly options: readonly { value: Theme; label: string }[] = [
    { value: 'dark', label: 'Oscuro' },
    { value: 'light', label: 'Claro' },
  ];
}
