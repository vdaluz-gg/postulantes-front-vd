export type PersonaId = 'post' | 'cli' | 'col';

export interface PersonaAction {
  readonly label: string;
  readonly primary?: boolean;
  /** Ruta interna. Sin ruta, la acción todavía no está disponible. */
  readonly link?: string;
}

export interface PersonaPrompt {
  readonly label: string;
  readonly placeholder: string;
  readonly submit: string;
}

export interface Persona {
  readonly id: PersonaId;
  /** Nombre del perfil para lectores de pantalla y para "Te llevo a ...". */
  readonly name: string;
  readonly question: string;
  readonly kicker: string;
  readonly title: string;
  readonly highlight: string;
  readonly prompt: PersonaPrompt;
  readonly suggestions: readonly string[];
  readonly chips: readonly string[];
  readonly actions: readonly PersonaAction[];
  readonly footnote: string;
  /** Portal privado del perfil. Null mientras no esté construido. */
  readonly portalLink: string | null;
}

export const PERSONAS: readonly Persona[] = [
  {
    id: 'post',
    name: 'Postulantes',
    question: '¿Sos postulante?',
    kicker: 'Postulantes · Busco trabajo',
    title: 'El trabajo de la Argentina,',
    highlight: 'en movimiento.',
    prompt: {
      label: 'Qué trabajo buscás',
      placeholder: 'Contale a la IA qué sabés hacer y dónde vivís',
      submit: 'Buscar',
    },
    suggestions: ['Chofer cerca de Moreno', 'Fábrica en Monte Grande', 'Trabajo de oficina', 'Algo en Salta'],
    chips: ['Ofertas cerca de tu casa primero', 'Avisos por WhatsApp oficial', 'Seguí cada postulación'],
    actions: [
      { label: 'Ver todas las ofertas →', primary: true, link: '/postulante' },
      { label: 'Dejar mi CV con IA', link: '/postulante' },
    ],
    footnote: 'Matching con IA · 14 sucursales en todo el país',
    portalLink: '/postulante',
  },
  {
    id: 'cli',
    name: 'Empresas',
    question: '¿Sos cliente?',
    kicker: 'Empresas · Busco talento',
    title: 'Tu dotación,',
    highlight: 'cubierta a tiempo.',
    prompt: {
      label: 'Qué necesita tu empresa',
      placeholder: 'Describí lo que necesitás y la IA arma la propuesta',
      submit: 'Consultar',
    },
    suggestions: [
      '40 operarios para un pico de producción',
      'Un jefe de ventas para CABA',
      'Tercerizar la liquidación de sueldos',
    ],
    chips: [
      'Personal eventual',
      'Búsqueda y selección',
      'RPO',
      'Outsourcing de capital humano',
      'Outsourcing de procesos',
    ],
    actions: [{ label: 'Armar mi propuesta con IA →', primary: true }, { label: 'Hablar con un asesor' }],
    footnote: 'Más de 700 empresas · 28 años · +120.000 puestos gestionados',
    portalLink: null,
  },
  {
    id: 'col',
    name: 'Colaboradores',
    question: '¿Sos colaborador?',
    kicker: 'Colaboradores · Ya trabajo con ustedes',
    title: 'Todo lo tuyo, en',
    highlight: 'Gestión Virtual.',
    prompt: {
      label: 'Qué necesitás resolver',
      placeholder: 'Preguntale a la IA: cobro, recibos, certificados…',
      submit: 'Preguntar',
    },
    suggestions: ['¿Cuándo cobro?', 'Mi recibo de octubre', 'Cargar un certificado', '¿Y mi tarjeta?'],
    chips: ['Fecha de cobro', 'Recibos de sueldo', 'Ausencias y certificados', 'Tarjeta de débito'],
    actions: [{ label: 'Gestión Virtual' }, { label: 'Descargar la app' }],
    footnote: 'Atención al colaborador · (+54 9) 11-3853-5542',
    portalLink: null,
  },
];

/** Elige el perfil más probable según lo que escribió la persona (mismas reglas de la maqueta). */
export function personaForQuery(query: string): PersonaId {
  const text = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (/cobr|recibo|sueldo|certific|ausen|tarjeta|ya trabajo|soy colaborador|gestion virtual|aguinaldo/.test(text)) {
    return 'col';
  }
  if (
    /empresa|personal|operarios|necesito \d|dotacion|propuesta|tercerizar|contratar|selecci|rpo|outsourcing|liquidacion/.test(
      text,
    )
  ) {
    return 'cli';
  }
  return 'post';
}
