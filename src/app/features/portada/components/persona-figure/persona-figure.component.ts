import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Persona } from '../../portada.data';

export type FigureState = 'idle' | 'lit' | 'selected' | 'away';

/**
 * Figura de un perfil en la portada: zona clickeable, halo, sombra de piso y la pregunta
 * "¿Sos ...?". La silueta es provisoria hasta integrar los avatares 3D (three.js + GLB).
 */
@Component({
  selector: 'app-persona-figure',
  templateUrl: './persona-figure.component.html',
  styleUrl: './persona-figure.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'state()',
    '[style.--acc]': '"var(--c-" + persona().id + ")"',
  },
})
export class PersonaFigureComponent {
  readonly persona = input.required<Persona>();
  readonly state = input<FigureState>('idle');

  readonly hovered = output<boolean>();
  readonly selected = output<void>();
}
