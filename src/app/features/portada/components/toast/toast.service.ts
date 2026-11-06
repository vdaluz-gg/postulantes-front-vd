import { Injectable, signal } from '@angular/core';

/** Cuánto se ve el aviso (maqueta). */
const VISIBLE_MS = 2800;

/** Aviso breve al pie de la portada: confirma una acción ("Recibo firmado ✓"). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  readonly visible = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.visible.set(true);
    this.timer = setTimeout(() => this.visible.set(false), VISIBLE_MS);
  }
}
