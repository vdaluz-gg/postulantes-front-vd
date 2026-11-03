import { DOCUMENT, Injectable, Type, inject, signal } from '@angular/core';
import { SoundService } from './sound.service';

export interface OpenSheet {
  readonly component: Type<unknown>;
  readonly inputs: Record<string, unknown>;
  /** Reemplaza a una hoja abierta: no repite la animación de entrada. */
  readonly replaced: boolean;
}

/**
 * Hoja lateral única del portal (en celular, hoja inferior). Abrir otra mientras hay una
 * abierta la reemplaza. Al cerrar, el foco vuelve al control que la abrió.
 */
@Injectable({ providedIn: 'root' })
export class SheetService {
  private readonly doc = inject(DOCUMENT);
  private readonly sound = inject(SoundService);
  private returnFocus: HTMLElement | null = null;

  readonly current = signal<OpenSheet | null>(null);

  open(component: Type<unknown>, inputs: Record<string, unknown> = {}): void {
    const replaced = !!this.current();
    if (!replaced) {
      this.returnFocus = this.doc.activeElement as HTMLElement | null;
      this.sound.play('open');
    }
    this.current.set({ component, inputs, replaced });
  }

  /** Cierre por una acción de la propia hoja (confirmar, enviar). */
  close(): void {
    if (!this.current()) return;
    this.current.set(null);
    const target = this.returnFocus;
    this.returnFocus = null;
    if (target?.isConnected) queueMicrotask(() => target.focus());
  }

  /** Cierre a pedido de la persona (X, fondo, Cancelar, Listo): suena "close". */
  dismiss(): void {
    if (!this.current()) return;
    this.sound.play('close');
    this.close();
  }
}
