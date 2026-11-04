/**
 * Datos que la portada entrega al portal después de la entrevista con el agente de IA.
 * Llegan por URL (parámetro p en base64) o por localStorage (clave gg_postulante).
 */
export interface InterviewHandoff {
  readonly v: 1;
  /** Índice de la búsqueda en el catálogo. */
  readonly job: number;
  readonly name?: string;
  readonly email?: string;
  readonly exp?: string;
  readonly match: number;
  /** Fecha de la reunión con la selectora (ISO o epoch). */
  readonly meeting: string | number;
  /** Fecha de la entrevista con el agente (ISO o epoch). */
  readonly at: string | number;
}

export type HandoffSource = 'url' | 'storage';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isInterviewHandoff(value: unknown): value is InterviewHandoff {
  if (!value || typeof value !== 'object') return false;
  const h = value as Partial<InterviewHandoff>;
  return h.v === 1 && Number.isInteger(h.job) && typeof h.match === 'number';
}
