import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, input, viewChild } from '@angular/core';
import { MotionService } from '../../../../../core/services/motion.service';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';

const ENTER: Keyframe[] = [
  { opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' },
  { opacity: 1, transform: 'none', filter: 'none' },
];

/**
 * Recuadro de vista previa de un tema: título con destello, una línea de escaneo que lo recorre
 * y el contenido, que vuelve a entrar con un fundido cada vez que cambia el tema (replayKey).
 */
@Component({
  selector: 'div[appPeekPanel]',
  imports: [IconComponent],
  templateUrl: './peek-panel.component.html',
  styleUrl: './peek-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeekPanelComponent {
  readonly heading = input.required<string>();
  readonly replayKey = input<string | null>(null);

  private readonly motion = inject(MotionService);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  constructor() {
    afterRenderEffect(() => {
      this.replayKey();
      if (this.motion.reduced()) return;
      this.content().nativeElement.animate?.(ENTER, { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
}
