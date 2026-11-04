import type { IconName } from '../../../shared/ui/atoms/icon/icons';

export type PortalSection = 'inicio' | 'postulaciones' | 'calendario' | 'ofertas' | 'mensajes' | 'perfil';

export interface NavBadge {
  readonly count: number;
  /** strong: pide una acción (color de sección). soft: solo informa. */
  readonly tone: 'strong' | 'soft';
  /** Texto para lectores de pantalla, por ejemplo "3 en curso". */
  readonly label: string;
}

export interface PortalNavItem {
  readonly section: PortalSection;
  readonly label: string;
  /** Etiqueta de la barra inferior en celular. */
  readonly short: string;
  readonly icon: IconName;
  /** En celular "Mi perfil" sale del menú y queda en el avatar (máximo 5 pestañas). */
  readonly inBottomBar: boolean;
}

export const PORTAL_NAV: readonly PortalNavItem[] = [
  { section: 'inicio', label: 'Inicio', short: 'Inicio', icon: 'home', inBottomBar: true },
  { section: 'postulaciones', label: 'Postulaciones', short: 'Postulaciones', icon: 'brief', inBottomBar: true },
  { section: 'calendario', label: 'Calendario', short: 'Calendario', icon: 'cal', inBottomBar: true },
  { section: 'ofertas', label: 'Ofertas para mí', short: 'Ofertas', icon: 'spark', inBottomBar: true },
  { section: 'mensajes', label: 'Mensajes y documentos', short: 'Mensajes', icon: 'mail', inBottomBar: true },
  { section: 'perfil', label: 'Mi perfil', short: 'Perfil', icon: 'user', inBottomBar: false },
];
