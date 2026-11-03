/**
 * Tipos del motor de avatares holográficos de la maqueta (public/vendor/gg-holo.js).
 * El motor es un bundle de three.js que expone window.GGMake.
 */

/** Rotación de matiz del holograma para tema oscuro y claro (en grados). */
export interface HoloAvatarConfig {
  readonly rotD: number;
  readonly rotL: number;
}

/** Parámetros de un cuadro. Las coordenadas son píxeles CSS del canvas, con el origen arriba a la izquierda. */
export interface HoloFrame {
  readonly W: number;
  readonly H: number;
  readonly dpr: number;
  /** Centro horizontal de la figura. */
  readonly cx: number;
  /** Posición vertical de los pies. */
  readonly feetY: number;
  /** Altura total de la figura. */
  readonly height: number;
  /** Elevación por flotación. */
  readonly lift: number;
  /** 1: silueta oscura en reposo; 0: holograma iluminado. */
  readonly lock: number;
  readonly theme: 'dark' | 'light';
  /** Mirada hacia el puntero: [vertical, horizontal], de -1 a 1. */
  readonly look: readonly [number, number];
  /** Progreso del saludo (0 a 1), o -1 sin saludo. */
  readonly wave: number;
  /** Intensidad de la caminata (0 a 1). */
  readonly walk: number;
  readonly away: boolean;
  readonly open: boolean;
  readonly settled: boolean;
  readonly fast: boolean;
  /** Giro del cuerpo en radianes. */
  readonly yaw: number;
  readonly dt: number;
  readonly t: number;
  /** Solo la cabeza, sin el resto del cuerpo (usado en el asistente). */
  readonly pose?: boolean;
  readonly noscan?: boolean;
  readonly nosmooth?: boolean;
}

export interface HoloAvatarEngine {
  /** Prepara la escena en el canvas con el modelo GLB en base64. Resuelve false si no se pudo. */
  init(canvas: HTMLCanvasElement, glbBase64: string): Promise<boolean>;
  frame(frame: HoloFrame): void;
  reset(): void;
  /** Opacidad de aparición (0 a 1) que el motor calcula mientras construye la figura. */
  readonly fd?: number;
  /** Progreso de construcción de la figura (0 a 1). */
  readonly build?: number;
}

export type HoloAvatarFactory = (config: HoloAvatarConfig) => HoloAvatarEngine;

declare global {
  interface Window {
    GGMake?: HoloAvatarFactory;
  }
}
