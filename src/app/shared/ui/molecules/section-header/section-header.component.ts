import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MotionService } from '../../../../core/services/motion.service';
import { ChipComponent } from '../../atoms/chip/chip.component';

const COUNT_MS = 700;

/**
 * Encabezado de tarjeta: H2 de 17 px con contador opcional (sube de 0 al valor) o acciones
 * proyectadas a la derecha ("Ver calendario").
 */
@Component({
  selector: 'app-section-header',
  imports: [ChipComponent],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly count = input<number | null>(null);

  private readonly motion = inject(MotionService);
  protected readonly shown = signal(0);
  private frame = 0;

  constructor() {
    effect(() => {
      const target = this.count();
      untracked(() => this.animateTo(target ?? 0));
    });
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  private animateTo(target: number): void {
    cancelAnimationFrame(this.frame);
    if (target <= 0 || this.motion.reduced()) {
      this.shown.set(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      this.shown.set(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) this.frame = requestAnimationFrame(step);
    };
    this.shown.set(0);
    this.frame = requestAnimationFrame(step);
  }
}
