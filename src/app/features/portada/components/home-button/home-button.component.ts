import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

/** Botón circular centrado arriba que vuelve a la elección de perfil. */
@Component({
  selector: 'button[appHomeButton]',
  imports: [IconComponent],
  templateUrl: './home-button.component.html',
  styleUrl: './home-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', 'aria-label': 'Ir al inicio', title: 'Inicio' },
})
export class HomeButtonComponent {}
