import { normalize } from '../../../shared/utils/text';

/** Animación que ilustra cada servicio en la vista previa. */
export type ServiceVisual = 'slots' | 'funnel' | 'loop' | 'docs' | 'belt';

/** Servicio para empresas (datos de ejemplo de la maqueta). */
export interface CompanyService {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly includes: readonly string[];
  readonly visual: ServiceVisual;
  /** Palabras con las que la IA reconoce el servicio en una consulta. */
  readonly keywords: string;
}

export const COMPANY_SERVICES: readonly CompanyService[] = [
  {
    id: 'eventual',
    title: 'Personal eventual',
    description:
      'Cubrimos grandes dotaciones con inmediatez, desde una base preseleccionada y con servicio de guardia fuera del horario administrativo.',
    includes: ['Base preseleccionada', 'Guardia fuera de horario', 'Habilitación MTSS 1243/342'],
    visual: 'slots',
    keywords:
      'eventual temporada pico reemplazo vacaciones operarios operario dotacion produccion guardia urgente personal necesito cubrir gente',
  },
  {
    id: 'seleccion',
    title: 'Búsqueda y selección',
    description:
      'Encontramos perfiles de todos los niveles con métodos de evaluación eficaces y conocimiento de cada industria.',
    includes: ['Evaluación por competencias', 'Mandos medios y gerencias', 'Informe de terna'],
    visual: 'funnel',
    keywords: 'seleccion busqueda perfil jefe gerente analista puesto ejecutivo vendedor ventas',
  },
  {
    id: 'rpo',
    title: 'RPO',
    description:
      'Nos hacemos cargo de todo tu proceso de reclutamiento, o de una etapa, con tus indicadores y tu marca empleadora.',
    includes: ['Procesos de alto volumen', 'Indicadores acordados', 'Equipo dedicado'],
    visual: 'loop',
    keywords: 'rpo reclutamiento volumen continuo contratacion',
  },
  {
    id: 'capital',
    title: 'Outsourcing de capital humano',
    description:
      'Administramos al personal que trabaja para tu empresa: altas, liquidación, recibos digitales y atención.',
    includes: ['Liquidación de sueldos', 'Recibos digitales', 'Atención al colaborador'],
    visual: 'docs',
    keywords:
      'nomina liquidacion sueldos recibos administrar administracion capital humano payroll',
  },
  {
    id: 'procesos',
    title: 'Outsourcing de procesos',
    description:
      'Tercerizamos procesos productivos completos con indicadores acordados, para que te enfoques en tu negocio.',
    includes: ['Gestión de punta a punta', 'Indicadores de productividad', 'Supervisión propia'],
    visual: 'belt',
    keywords: 'proceso linea deposito planta tercerizar operacion logistica empaque',
  },
];

export const serviceById = (id: string): CompanyService =>
  COMPANY_SERVICES.find((s) => s.id === id) ?? COMPANY_SERVICES[0];

const words = (text: string) =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

/** Servicio que mejor responde a la consulta (por palabras clave); sin coincidencias, personal eventual. */
export function recommendService(query: string): CompanyService {
  const terms = words(query);
  let best = COMPANY_SERVICES[0];
  let bestScore = 0;
  for (const service of COMPANY_SERVICES) {
    const score = terms.filter((t) => service.keywords.includes(t)).length;
    if (score > bestScore) {
      best = service;
      bestScore = score;
    }
  }
  return best;
}

/** Zonas que la IA reconoce en la consulta (ejemplo). */
const ZONES = ['caba', 'monte grande', 'cordoba', 'rosario', 'mendoza', 'salta', 'pilar', 'moron'];
const ZONE_LABEL: Readonly<Record<string, string>> = {
  caba: 'CABA',
  cordoba: 'Córdoba',
  moron: 'Morón',
};

export interface ProposalRow {
  readonly label: string;
  readonly value: string;
  /** Ocupa las dos columnas. */
  readonly wide?: boolean;
}

/** Propuesta que arma la IA con lo que escribió la empresa: servicio, dotación, zona y plazo. */
export function draftProposal(query: string, service: CompanyService): ProposalRow[] {
  const text = normalize(query);
  const headcount = query.match(/\d+/)?.[0];
  const zone = ZONES.find((z) => text.includes(z));
  return [
    { label: 'Servicio', value: service.title, wide: true },
    {
      label: 'Dotación',
      value: headcount ? `${headcount} ${headcount === '1' ? 'persona' : 'personas'}` : 'A definir',
    },
    {
      label: 'Zona',
      value: zone
        ? (ZONE_LABEL[zone] ?? zone.replace(/\b\w/g, (c) => c.toUpperCase()))
        : 'A definir con tu asesor',
    },
    { label: 'Para cuándo', value: 'Lo antes posible · te contactamos hoy', wide: true },
  ];
}

/** Teléfono de atención a empresas que muestra la maqueta. */
export const ADVISOR_PHONE = '0810-345-4378';
