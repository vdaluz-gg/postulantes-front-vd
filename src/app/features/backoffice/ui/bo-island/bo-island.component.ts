import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MotionService } from '../../../../core/services/motion.service';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { IslandMessage, IslandService } from './island.service';

/** Tiempos del sistema de diseño: se expande a los 320 ms y queda 6,2 s (9 s con acción). */
const EXPAND_MS = 320;
const STAY_MS = 6200;
const STAY_ACTION_MS = 9000;
const CLOSE_MS = 600;

type Phase = 'dot' | 'open' | 'closing';

/** Isla de avisos: píldora fija arriba al centro, anunciada como `role="status"`. */
@Component({
  selector: 'bo-island',
  imports: [IconComponent],
  templateUrl: './bo-island.component.html',
  styleUrl: './bo-island.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoIslandComponent {
  private readonly island = inject(IslandService);
  private readonly motion = inject(MotionService);
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly shown = signal<IslandMessage | null>(null);
  protected readonly phase = signal<Phase>('dot');

  constructor() {
    effect(() => {
      const message = this.island.message();
      untracked(() => this.play(message));
    });
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  protected act(message: IslandMessage): void {
    message.action?.();
    this.close(message.id);
  }

  private play(message: IslandMessage | null): void {
    this.clear();
    if (!message) {
      this.shown.set(null);
      return;
    }
    const reduced = this.motion.reduced();
    this.shown.set(message);
    this.phase.set(reduced ? 'open' : 'dot');
    if (!reduced) this.later(EXPAND_MS, () => this.phase.set('open'));
    this.later((reduced ? 0 : EXPAND_MS) + (message.action ? STAY_ACTION_MS : STAY_MS), () =>
      this.close(message.id),
    );
  }

  private close(id: number): void {
    this.phase.set('closing');
    this.later(this.motion.reduced() ? 0 : CLOSE_MS, () => {
      this.shown.set(null);
      this.island.dismiss(id);
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clear(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
