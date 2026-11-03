import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Si hay que apagar el movimiento: preferencia del sistema o el ajuste "Reducir movimiento"
 * del portal (data-motion="reduce" en <html>).
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly doc = inject(DOCUMENT);

  reduced(): boolean {
    if (this.doc.documentElement.getAttribute('data-motion') === 'reduce') return true;
    return !!this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }
}
