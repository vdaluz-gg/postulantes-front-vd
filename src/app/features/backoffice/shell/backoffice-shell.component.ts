import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BoIslandComponent } from '../ui/bo-island/bo-island.component';

/**
 * Contenedor del backoffice: aplica su color de sección (azul, el acento del sistema que no usa
 * ningún portal) y la tipografía de producto, y monta la isla de avisos.
 */
@Component({
  selector: 'app-backoffice-shell',
  imports: [RouterOutlet, BoIslandComponent],
  templateUrl: './backoffice-shell.component.html',
  styleUrl: './backoffice-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackofficeShellComponent {}
