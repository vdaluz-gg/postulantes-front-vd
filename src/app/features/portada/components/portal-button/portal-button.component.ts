import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Llamado destacado "Ingresar a tu portal": degradé del acento del perfil (--acc),
 * pulso y brillo animados. Se aplica sobre un enlace: <a appPortalButton routerLink="...">.
 */
@Component({
  selector: 'a[appPortalButton]',
  templateUrl: './portal-button.component.html',
  styleUrl: './portal-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalButtonComponent {}
