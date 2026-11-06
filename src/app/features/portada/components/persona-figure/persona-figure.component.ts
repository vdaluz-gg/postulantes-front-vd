import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { AvatarSpin } from '../../../../shared/three/avatar-spin';
import {
  HoloAvatarComponent,
  HoloAvatarState,
  HoloAvatarStatus,
} from '../../../../shared/three/holo-avatar/holo-avatar.component';
import { Persona } from '../../portada.data';

export type FigureState = HoloAvatarState;

/** Píxeles que tiene que moverse el puntero para que el gesto cuente como arrastre y no como click. */
const DRAG_THRESHOLD = 4;
/** Giro por cada flecha del teclado, en radianes. */
const KEY_TURN = 0.4;

interface Press {
  readonly id: number;
  x: number;
  y: number;
  moved: boolean;
}

@Component({
  selector: 'app-persona-figure',
  imports: [HoloAvatarComponent],
  templateUrl: './persona-figure.component.html',
  styleUrl: './persona-figure.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'state()',
    '[class.has-3d]': 'avatarStatus() === "ready"',
    '[class.grabbing]': 'grabbing()',
    '[style.--acc]': '"var(--c-" + persona().id + ")"',
  },
})
export class PersonaFigureComponent {
  readonly persona = input.required<Persona>();
  readonly state = input<FigureState>('idle');

  readonly hovered = output<boolean>();
  readonly selected = output<void>();

  protected readonly avatarStatus = signal<HoloAvatarStatus | 'loading'>('loading');
  protected readonly spin = new AvatarSpin();
  protected readonly grabbing = signal(false);

  private press: Press | null = null;
  private dragged = false;

  protected onPress(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    this.dragged = false;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  protected onMove(event: PointerEvent): void {
    const press = this.press;
    if (!press || event.pointerId !== press.id) return;
    const dx = event.clientX - press.x;
    if (!press.moved && Math.hypot(dx, event.clientY - press.y) > DRAG_THRESHOLD) {
      press.moved = true;
      this.spin.grab();
      this.grabbing.set(true);
    }
    if (press.moved) this.spin.drag(dx);
    press.x = event.clientX;
    press.y = event.clientY;
  }

  /** Al soltar después de arrastrar, el click que sigue no elige el perfil. */
  protected onRelease(event: PointerEvent): void {
    const press = this.press;
    if (!press || event.pointerId !== press.id) return;
    this.press = null;
    if (!press.moved) return;
    this.spin.release();
    this.grabbing.set(false);
    this.dragged = event.type === 'pointerup';
  }

  protected onClick(): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.selected.emit();
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.spin.nudge(event.key === 'ArrowLeft' ? -KEY_TURN : KEY_TURN);
  }
}
