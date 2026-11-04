/**
 * Oferta tal como llega del mock (public/mock/ofertas.json) y, más adelante, de la API.
 * Refleja la ficha completa de la búsqueda: los datos de la publicación y los internos.
 */
export interface JobOfferDto {
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
  /** Zona de trabajo como se publica: "Moreno / Parque Avellaneda". */
  readonly zona: string;
  /** Rubro publicado: "Logística", "RR. HH.". */
  readonly rubro: string;
  readonly horario: string;
  /** Fecha ISO (AAAA-MM-DD). */
  readonly fechaPublicacion: string;
  readonly requisitos: readonly string[];
  readonly beneficios: readonly string[];
  readonly vacantes: number;
  readonly salario: number;
  readonly domicilioExplotacion: { readonly direccion: string; readonly radioKm: number };
  readonly cliente: string;
  readonly gestionadora: string;
  readonly area: string;
  readonly puestoId: number;
  readonly tipo: string;
  readonly alcance: string;
  readonly prioridad: string;
  readonly tipoBusquedaId: number;
  readonly modalidadId: number;
  readonly jerarquiaId: number;
  readonly convenio: string;
  readonly rama: string;
  readonly categoria: string;
  readonly experienciaObligatoria: boolean;
  readonly bajaReincorporable: boolean;
  readonly requiereIndumentaria: boolean;
  readonly examenPreocupacional: boolean;
  readonly observacionesCliente: string;
}

export interface JobOffersResponse {
  readonly ofertas: readonly JobOfferDto[];
}

/**
 * Oferta como la ve el postulante en la portada: solo la publicación. Salario, vacantes,
 * domicilio, cliente, convenio y el resto de la ficha interna no salen del mapeo.
 */
export interface JobPosting {
  readonly ref: string;
  readonly title: string;
  readonly description: string;
  readonly zone: string;
  readonly area: string;
  readonly schedule: string;
  readonly publishedOn: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
}

export function toJobPosting(dto: JobOfferDto): JobPosting {
  return {
    ref: dto.codigo,
    title: dto.titulo,
    description: dto.descripcion,
    zone: dto.zona,
    area: dto.rubro,
    schedule: dto.horario,
    publishedOn: dto.fechaPublicacion,
    requirements: dto.requisitos,
    benefits: dto.beneficios,
  };
}

/** Día y mes de una fecha ISO: "2026-10-06" → "06/10". */
export const formatDayMonth = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
