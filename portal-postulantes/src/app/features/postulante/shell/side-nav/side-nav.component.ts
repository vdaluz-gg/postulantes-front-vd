import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BrandComponent } from '../../../../shared/ui/atoms/brand/brand.component';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { NavBadge, PORTAL_NAV, PortalSection } from '../portal-nav';

/**
 * Navegación principal: barra lateral en escritorio (marca, secciones con contador, pie con
 * "Volver a la portada" y "Salir") y barra inferior de 5 pestañas en celular.
 */
@Component({
  selector: 'app-side-nav',
  imports: [RouterLink, RouterLinkActive, BrandComponent, ButtonComponent, IconComponent],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {
  readonly badges = input<Partial<Record<PortalSection, NavBadge | null>>>({});
  readonly logout = output<void>();

  protected readonly items = PORTAL_NAV;
}
