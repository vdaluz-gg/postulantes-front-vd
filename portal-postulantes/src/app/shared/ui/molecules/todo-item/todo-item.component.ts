import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, output, signal } from '@angular/core';
import { MotionService } from '../../../../core/services/motion.service';
import { SoundService } from '../../../../core/services/sound.service';
import { ButtonComponent } from '../../atoms/button/button.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icons';

/** Tiempos de la tilde que se tacha (sistema de diseño, 4.6). */
const COLLAPSE_AT_MS = 850;
const ACTION_AT_MS = 1200;

/**
 * Fila de "Para hacer ahora": ícono, título, detalle y una acción. Si es completable, al tocarla
 * se tilda, se tacha, colapsa y recién entonces emite la acción. Con movimiento reducido emite
 * de inmediato.
 */
@Component({
  selector: 'div[appTodo]',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'todo',
    '[class.done]': 'state() !== "idle"',
    '[class.gone]': 'state() === "gone"',
    '[style.height.px]': 'lockedHeight()',
  },
})
export class TodoItemComponent {
  readonly icon = input.required<IconName>();
  readonly heading = input.required<string>();
  readonly detail = input('');
  readonly actionLabel = input.required<string>();
  /** La acción da por resuelta la tarea (por ejemplo, confirmar una reunión). */
  readonly completes = input(false);
  readonly action = output<void>();

  private readonly motion = inject(MotionService);
  private readonly sound = inject(SoundService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly state = signal<'idle' | 'done' | 'gone'>('idle');
  protected readonly lockedHeight = signal<number | null>(null);
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected run(): void {
    if (!this.completes() || this.motion.reduced()) {
      this.action.emit();
      return;
    }
    if (this.state() !== 'idle') return;
    this.lockedHeight.set(this.host.offsetHeight);
    this.state.set('done');
    this.sound.play('done');
    this.timers.push(
      setTimeout(() => this.state.set('gone'), COLLAPSE_AT_MS),
      setTimeout(() => this.action.emit(), ACTION_AT_MS),
    );
  }
}
