import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Encabezado de vista: H1 (recibe el foco al navegar, id="h1") y bajada; las acciones
 * proyectadas van a la derecha y bajan de línea si no entran.
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly lead = input('');
}
