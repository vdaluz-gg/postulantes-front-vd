import { Injectable, inject, signal } from '@angular/core';
import { SoundService } from '../../../../core/services/sound.service';

export interface IslandMessage {
  readonly id: number;
  readonly text: string;
  readonly tone: 'ok' | 'alert';
  readonly actionLabel?: string;
  readonly action?: () => void;
}

/** Avisos en la isla: uno a la vez; el nuevo reemplaza al anterior. */
@Injectable({ providedIn: 'root' })
export class IslandService {
  private readonly sound = inject(SoundService);
  private nextId = 0;

  readonly message = signal<IslandMessage | null>(null);

  show(
    text: string,
    options: { tone?: 'ok' | 'alert'; actionLabel?: string; action?: () => void } = {},
  ): void {
    this.message.set({
      id: this.nextId++,
      text,
      tone: options.tone ?? 'ok',
      actionLabel: options.actionLabel,
      action: options.action,
    });
    this.sound.play('notify');
  }

  dismiss(id: number): void {
    if (this.message()?.id === id) this.message.set(null);
  }
}
