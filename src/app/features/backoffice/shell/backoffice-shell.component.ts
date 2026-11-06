import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore, LOGIN_PATH } from '../data/auth.store';
import { BoIslandComponent } from '../ui/bo-island/bo-island.component';

/**
 * Contenedor del backoffice: aplica su color de sección (azul, el acento del sistema que no usa
 * ningún portal) y la tipografía de producto, y monta la isla de avisos. Si la sesión vence
 * mientras se trabaja, vuelve al ingreso y después a la misma pantalla.
 */
@Component({
  selector: 'app-backoffice-shell',
  imports: [RouterOutlet, BoIslandComponent],
  templateUrl: './backoffice-shell.component.html',
  styleUrl: './backoffice-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackofficeShellComponent {
  constructor() {
    const auth = inject(AuthStore);
    const router = inject(Router);
    effect(() => {
      if (!auth.expired() || router.url.startsWith(LOGIN_PATH)) return;
      void router.navigate([LOGIN_PATH], { queryParams: { volver: router.url } });
    });
  }
}
