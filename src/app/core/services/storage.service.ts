import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Claves compartidas con la portada y los portales de la maqueta. */
export const STORAGE_KEYS = {
  theme: 'gg_pt',
  sound: 'gg_sound',
  session: 'gg_pses',
  appearance: 'gg_pa11y',
  handoff: 'gg_postulante',
} as const;

/**
 * Acceso a localStorage tolerante a fallos: navegación privada, almacenamiento bloqueado o SSR.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly available = isPlatformBrowser(inject(PLATFORM_ID));

  get(key: string): string | null {
    if (!this.available) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!this.available) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Sin almacenamiento disponible: el valor vive solo en memoria. */
    }
  }

  remove(key: string): void {
    if (!this.available) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* Sin almacenamiento disponible. */
    }
  }

  getJson<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
