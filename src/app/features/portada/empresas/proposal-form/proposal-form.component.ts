import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, input, output, signal } from '@angular/core';
import { MotionService } from '../../../../core/services/motion.service';
import { PortadaButtonComponent } from '../../components/portada-button/portada-button.component';
import { ProposalRow } from '../company-services';

/** Velocidad del tipeo de la IA (la misma del formulario del postulante). */
const TYPE_CHAR_MS = 18;
const TYPE_FIELD_MS = 120;

/**
 * Propuesta armada por la IA: escribe cada dato letra por letra y, al terminar, habilita
 * "Enviar a un asesor". Con movimiento reducido aparece completa.
 */
@Component({
  selector: 'div[appProposalForm]',
  imports: [PortadaButtonComponent],
  templateUrl: './proposal-form.component.html',
  styleUrl: './proposal-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalFormComponent {
  readonly rows = input.required<readonly ProposalRow[]>();
  readonly send = output<void>();

  private readonly motion = inject(MotionService);
  protected readonly values = signal<readonly string[]>([]);
  protected readonly typing = signal(-1);
  protected readonly done = signal(false);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    afterNextRender(() => this.write());
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  private write(): void {
    const texts = this.rows().map((r) => r.value);
    if (this.motion.reduced()) {
      this.values.set(texts);
      this.done.set(true);
      return;
    }
    let at = 0;
    texts.forEach((text, row) => {
      this.later(at, () => this.typing.set(row));
      for (let i = 1; i <= text.length; i++) {
        this.later(at + i * TYPE_CHAR_MS, () => this.values.update((v) => Object.assign([...v], { [row]: text.slice(0, i) })));
      }
      at += text.length * TYPE_CHAR_MS + TYPE_FIELD_MS;
    });
    this.later(at, () => {
      this.typing.set(-1);
      this.done.set(true);
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
