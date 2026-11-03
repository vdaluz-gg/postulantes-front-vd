import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

/** Inicio del portal. Por ahora solo confirma la sesión; el contenido llega con el shell del portal. */
@Component({
  selector: 'app-home-page',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.session.end();
    void this.router.navigate(['/postulante/ingresar']);
  }
}
