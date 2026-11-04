import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { PageHeaderComponent } from '../../../../shared/ui/molecules/page-header/page-header.component';
import { SectionHeaderComponent } from '../../../../shared/ui/molecules/section-header/section-header.component';
import { PortalSessionService } from '../../services/portal-session.service';

/**
 * Mi perfil. El formulario llega en su propio paso. En celular, donde no hay barra lateral,
 * acá están "Volver a la portada" y "Salir".
 */
@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, ButtonComponent, IconComponent, PageHeaderComponent, SectionHeaderComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly portalSession = inject(PortalSessionService);
}
