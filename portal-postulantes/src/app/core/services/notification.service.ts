import { Injectable, signal } from '@angular/core';

export interface NoticeAction {
  readonly label: string;
  readonly run: () => void;
}

export interface Notice {
  readonly id: number;
  readonly message: string;
  readonly action?: NoticeAction;
}

/**
 * Avisos breves de la isla. Se muestra uno por vez: un aviso nuevo reemplaza al anterior.
 * Los mensajes van en pasado y en segunda persona ("Confirmaste la reunión.").
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private seq = 0;
  readonly current = signal<Notice | null>(null);

  notify(message: string, action?: NoticeAction): void {
    this.current.set({ id: ++this.seq, message, action });
  }

  dismiss(id: number): void {
    if (this.current()?.id === id) this.current.set(null);
  }
}
