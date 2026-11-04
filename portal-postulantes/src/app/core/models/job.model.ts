/** Búsqueda laboral del catálogo compartido con la portada. */
export interface JobOpening {
  readonly id: number;
  readonly title: string;
  readonly zone: string;
  readonly area: string;
  readonly ref: string;
  readonly shift: string;
  /** Minutos de viaje estimados desde la localidad del postulante. */
  readonly minutes: number;
  readonly benefits: readonly string[];
  /** Afinidad calculada por la IA (0 a 100). */
  readonly match: number;
  /** Explicación de la IA de por qué se recomienda. */
  readonly reason: string;
}

/** Oferta recomendada: búsqueda abierta a la que el postulante todavía no se postuló. */
export interface JobOffer {
  readonly id: string;
  readonly jobId: number;
  readonly ref: string;
  readonly title: string;
  readonly zone: string;
  readonly minutes: number;
  readonly match: number;
  readonly tags: readonly string[];
  readonly reason: string;
}

export type OfferSort = 'match' | 'distance';

/** Afinidad mínima para mostrar una búsqueda como oferta. */
export const MIN_OFFER_MATCH = 50;

export function toOffer(job: JobOpening): JobOffer {
  return {
    id: String(job.id),
    jobId: job.id,
    ref: job.ref,
    title: job.title,
    zone: job.zone,
    minutes: job.minutes,
    match: job.match,
    tags: [job.shift, ...job.benefits.slice(0, 2)],
    reason: job.reason,
  };
}
