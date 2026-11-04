/**
 * Oferta tal como llega del mock (public/mock/ofertas.json) y, más adelante, de la API.
 * Refleja la ficha completa de la búsqueda, incluidos datos internos.
 */
export interface JobOfferDto {
  readonly codigo: string;
  readonly titulo: string;
  readonly descripcion: string;
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
 * Oferta como la ve el postulante en la portada. Solo datos públicos: no incluye cliente,
 * gestionadora, prioridad, identificadores internos ni observaciones del cliente.
 */
export interface JobPosting {
  readonly ref: string;
  readonly title: string;
  readonly description: string;
  readonly vacancies: number;
  readonly salary: number;
  readonly address: string;
  readonly radiusKm: number;
  readonly area: string;
  readonly hiring: string;
  readonly branch: string;
  readonly agreement: string;
  readonly category: string;
  readonly experienceRequired: boolean;
  readonly uniformRequired: boolean;
  readonly medicalExamRequired: boolean;
}

export function toJobPosting(dto: JobOfferDto): JobPosting {
  return {
    ref: dto.codigo,
    title: dto.titulo,
    description: dto.descripcion,
    vacancies: dto.vacantes,
    salary: dto.salario,
    address: dto.domicilioExplotacion.direccion,
    radiusKm: dto.domicilioExplotacion.radioKm,
    area: dto.area,
    hiring: dto.tipo,
    branch: dto.rama,
    agreement: dto.convenio,
    category: dto.categoria,
    experienceRequired: dto.experienciaObligatoria,
    uniformRequired: dto.requiereIndumentaria,
    medicalExamRequired: dto.examenPreocupacional,
  };
}

/** Salario en pesos con separador de miles: 912359 → "$ 912.359". */
export const formatSalary = (amount: number): string =>
  `$ ${amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
