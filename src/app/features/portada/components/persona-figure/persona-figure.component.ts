import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  HoloAvatarComponent,
  HoloAvatarState,
  HoloAvatarStatus,
} from '../../../../shared/three/holo-avatar/holo-avatar.component';
import { Persona } from '../../portada.data';

export type FigureState = HoloAvatarState;

/**
 * Figura de un perfil en la portada: zona clickeable, halo, luz de piso y la pregunta
 * "¿Sos ...?". Con avatar 3D configurado lo renderiza; mientras carga, o si el navegador
 * no puede mostrarlo, queda la silueta.
 */
@Component({
  selector: 'app-persona-figure',
  imports: [HoloAvatarComponent],
  templateUrl: './persona-figure.component.html',
  styleUrl: './persona-figure.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'state()',
    '[class.has-3d]': 'avatarStatus() === "ready"',
    '[style.--acc]': '"var(--c-" + persona().id + ")"',
  },
})
export class PersonaFigureComponent {
  readonly persona = input.required<Persona>();
  readonly state = input<FigureState>('idle');

  readonly hovered = output<boolean>();
  readonly selected = output<void>();

  protected readonly avatarStatus = signal<HoloAvatarStatus | 'loading'>('loading');
}
