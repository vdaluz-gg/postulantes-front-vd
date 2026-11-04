import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { MotionService } from '../../../../core/services/motion.service';
import { Notice, NotificationService } from '../../../../core/services/notification.service';
import { SoundService } from '../../../../core/services/sound.service';
import { IconComponent } from '../../atoms/icon/icon.component';

type Phase = 'born' | 'in' | 'open' | 'closing' | 'out';

/** Tiempos de la isla (sistema de diseño, 4.5). */
const EXPAND_MS = 320;
const VISIBLE_MS = 6200;
const VISIBLE_WITH_ACTION_MS = 9000;
const COLLAPSE_MS = 350;
const REMOVE_MS = 1300;

/**
 * Isla de avisos: nace como punto, se expande con el check y el mensaje, queda unos segundos
 * y se contrae. El texto se anuncia en una región viva persistente.
 */
@Component({
  selector: 'app-notification-island',
  imports: [IconComponent],
  templateUrl: './notification-island.component.html',
  styleUrl: './notification-island.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationIslandComponent {
  private readonly notifications = inject(NotificationService);
  private readonly sound = inject(SoundService);
  private readonly motion = inject(MotionService);

  protected readonly notice = signal<Notice | null>(null);
  protected readonly phase = signal<Phase>('born');
  protected readonly announcement = signal('');

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    effect(() => {
      const next = this.notifications.current();
      untracked(() => this.show(next));
    });
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected runAction(notice: Notice): void {
    notice.action?.run();
    this.close(notice);
  }

  private show(notice: Notice | null): void {
    this.clearTimers();
    this.notice.set(notice);
    if (!notice) return;
    this.announcement.set(notice.message);

    if (this.motion.reduced()) {
      this.phase.set('open');
    } else {
      this.phase.set('born');
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.phase.set('in');
          this.sound.play('notify');
          this.later(EXPAND_MS, () => this.phase.set('open'));
        }),
      );
    }
    this.later(notice.action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS, () => this.close(notice));
  }

  private close(notice: Notice): void {
    this.clearTimers();
    this.phase.set('closing');
    this.later(COLLAPSE_MS, () => this.phase.set('out'));
    this.later(REMOVE_MS, () => {
      this.notice.set(null);
      this.notifications.dismiss(notice.id);
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
