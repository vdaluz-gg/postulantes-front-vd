import { HoloAvatarConfig } from '../../shared/three/holo-avatar.types';

export type PersonaId = 'post' | 'cli' | 'col';

export interface PersonaAvatar {
  /** Modelo GLB servido desde public/. */
  readonly model: string;
  readonly config: HoloAvatarConfig;
}

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

/** Tramo de un texto; los datos clave van en negrita. */
export interface TextPart {
  readonly text: string;
  readonly strong?: boolean;
}

/** Punto del mapa en porcentaje del ancho (x) y del alto (y). */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface MapPin extends MapPoint {
  readonly label: string;
}

export type TrackerStepState = 'done' | 'now' | 'next';

export interface TrackerStep {
  readonly label: string;
  readonly when: string;
  readonly state: TrackerStepState;
}

/** Vista previa que se muestra al pasar o tocar un tema del panel. */
export type PeekContent =
  | { readonly kind: 'map'; readonly title: string; readonly home: MapPoint; readonly pins: readonly MapPin[] }
  | {
      readonly kind: 'whatsapp';
      readonly title: string;
      readonly sender: string;
      readonly message: readonly TextPart[];
      readonly actions: readonly PersonaAction[];
    }
  | { readonly kind: 'tracker'; readonly title: string; readonly steps: readonly TrackerStep[] };

export interface PersonaChip {
  readonly id: string;
  readonly label: string;
  readonly peek?: PeekContent;
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
  readonly chips: readonly PersonaChip[];
  readonly actions: readonly PersonaAction[];
  readonly footnote: string;
  /** Portal privado del perfil. Null mientras no esté construido. */
  readonly portalLink: string | null;
  /** Avatar 3D. Sin avatar se muestra la silueta. */
  readonly avatar?: PersonaAvatar;
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
    chips: [
      {
        id: 'cerca',
        label: 'Ofertas cerca de tu casa primero',
        peek: {
          kind: 'map',
          title: 'Ordenado por cercanía a tu casa',
          home: { x: 30, y: 60 },
          pins: [
            { label: 'Operario/a · 12 min', x: 58, y: 30 },
            { label: 'Autoelevador · 18 min', x: 74, y: 66 },
            { label: 'Chofer · 25 min', x: 18, y: 24 },
          ],
        },
      },
      {
        id: 'wa',
        label: 'Avisos por WhatsApp oficial',
        peek: {
          kind: 'whatsapp',
          title: 'Así te avisa la IA',
          sender: 'Grupo Gestión · número oficial',
          message: [
            { text: '¡Hola! Hay una oferta nueva a 12 minutos de tu casa: ' },
            { text: 'Operario/a de producción', strong: true },
            { text: ' en Monte Grande. ¿Querés que te postule?' },
          ],
          actions: [
            { label: 'Sí, postulame', primary: true },
            { label: 'Ver más ofertas' },
          ],
        },
      },
      {
        id: 'estado',
        label: 'Seguí cada postulación',
        peek: {
          kind: 'tracker',
          title: 'Tu postulación, en tiempo real',
          steps: [
            { label: 'Postulación recibida', when: 'lun 14:02', state: 'done' },
            { label: 'CV revisado por la IA', when: 'lun 14:03', state: 'done' },
            { label: 'Entrevista en sucursal', when: 'vie 10:00', state: 'now' },
            { label: 'Ingreso', when: 'A confirmar', state: 'next' },
          ],
        },
      },
    ],
    actions: [
      { label: 'Ver todas las ofertas →', primary: true },
      { label: 'Dejar mi CV con IA' },
    ],
    footnote: 'Matching con IA · 14 sucursales en todo el país',
    portalLink: null,
    avatar: { model: 'assets/models/postulante.glb', config: { rotD: 0, rotL: 0 } },
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
      { id: 'eventual', label: 'Personal eventual' },
      { id: 'seleccion', label: 'Búsqueda y selección' },
      { id: 'rpo', label: 'RPO' },
      { id: 'capital', label: 'Outsourcing de capital humano' },
      { id: 'procesos', label: 'Outsourcing de procesos' },
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
    chips: [
      { id: 'cobro', label: 'Fecha de cobro' },
      { id: 'recibo', label: 'Recibos de sueldo' },
      { id: 'cert', label: 'Ausencias y certificados' },
      { id: 'tarjeta', label: 'Tarjeta de débito' },
    ],
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
