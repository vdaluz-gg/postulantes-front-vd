import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Encabezado del panel de propiedades: tipo de elemento, nombre, clave y acciones proyectadas. */
@Component({
  selector: 'app-inspector-head',
  templateUrl: './inspector-head.component.html',
  styleUrl: './inspector-head.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorHeadComponent {
  readonly kind = input.required<string>();
  readonly title = input.required<string>();
  /** Clave que usa la API; se muestra para que el equipo técnico la ubique. */
  readonly dataKey = input('');
  readonly context = input('');
}
