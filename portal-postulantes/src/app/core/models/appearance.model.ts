import type { AccentId } from '../theme/palette';

export type ThemeChoice = 'dark' | 'light' | 'hc';
export type TextScale = 1 | 1.12 | 1.25;

export interface AppearanceSettings {
  readonly theme: ThemeChoice;
  readonly text: TextScale;
  /** Tipografía más legible. */
  readonly font: boolean;
  /** Reducir movimiento. */
  readonly motion: boolean;
  /** Asistente con movimiento (sigue el puntero). */
  readonly cube: boolean;
  /** Leer en voz alta las respuestas del asistente. */
  readonly voice: boolean;
  readonly accent: AccentId;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'dark',
  text: 1,
  font: false,
  motion: false,
  cube: true,
  voice: false,
  accent: 'vio',
};

export const THEME_OPTIONS: readonly { value: ThemeChoice; label: string }[] = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
  { value: 'hc', label: 'Alto contraste' },
];

export const TEXT_SCALE_OPTIONS: readonly { value: TextScale; label: string }[] = [
  { value: 1, label: 'Normal' },
  { value: 1.12, label: 'Grande' },
  { value: 1.25, label: 'Muy grande' },
];
