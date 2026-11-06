import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo de Grupo Gestión con la pastilla del área. Logo blanco en tema oscuro y a color en claro
 * (no se le tocan los colores).
 */
@Component({
  selector: 'bo-brand',
  templateUrl: './bo-brand.component.html',
  styleUrl: './bo-brand.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoBrandComponent {
  readonly label = input('Administración');
}
