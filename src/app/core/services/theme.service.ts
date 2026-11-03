import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from './storage.service';

export type Theme = 'dark' | 'light';

/** Tema claro u oscuro compartido por la portada y los portales (atributo data-theme en <html>). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  readonly theme = signal<Theme>('dark');

  init(): void {
    const saved = this.storage.get(STORAGE_KEYS.theme);
    this.apply(saved === 'light' ? 'light' : 'dark', false);
  }

  set(theme: Theme): void {
    this.apply(theme, true);
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme, persist: boolean): void {
    this.theme.set(theme);
    this.doc.documentElement.setAttribute('data-theme', theme);
    if (persist) this.storage.set(STORAGE_KEYS.theme, theme);
  }
}
