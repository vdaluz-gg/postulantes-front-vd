/**
 * Paleta de marca para uso desde TypeScript (WebGL, acentos dinámicos).
 * Debe mantenerse alineada con las primitivas --gg-* de src/styles/tokens.css.
 */
export const BRAND = {
  violet500: '#8b3bf0',
  violet600: '#7a2be3',
} as const;

export type AccentId = 'vio' | 'azul' | 'menta' | 'naranja' | 'rosa';

export interface AccentOption {
  readonly id: AccentId;
  readonly label: string;
  /** Color base del acento: swatch y --vio. */
  readonly color: string;
  /** Texto de acento para el tema oscuro (--vio-t). El acento por defecto no lo redefine. */
  readonly tint?: string;
}

export const ACCENTS: readonly AccentOption[] = [
  { id: 'vio', label: 'Violeta', color: BRAND.violet500 },
  { id: 'azul', label: 'Azul', color: '#2f6fe8', tint: '#a9c8ff' },
  { id: 'menta', label: 'Menta', color: '#0b8a67', tint: '#6ee7c1' },
  { id: 'naranja', label: 'Naranja', color: '#d4530a', tint: '#ffb184' },
  { id: 'rosa', label: 'Rosa', color: '#d62f8f', tint: '#ff9ccd' },
];

/** Color de los puntos de la esfera holográfica: [tema oscuro, tema claro]. */
export const ORB_COLORS: readonly [dark: string, light: string] = [BRAND.violet500, BRAND.violet600];
