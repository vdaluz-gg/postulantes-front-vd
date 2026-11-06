import { normalize } from '../../../shared/utils/text';
import type { TrackerStep } from '../portada.data';

/**
 * Datos de ejemplo del legajo de un colaborador, como en la maqueta. Las fechas se calculan desde
 * hoy para que el ejemplo no envejezca.
 */

export type CollaboratorTopic = 'cobro' | 'recibo' | 'cert' | 'tarjeta';

/** Tema del legajo al que apunta la pregunta, o null si la IA no lo reconoce. */
export function topicForQuestion(question: string): CollaboratorTopic | null {
  const text = normalize(question);
  if (/cobr|pago|fecha|plata|aguinaldo/.test(text)) return 'cobro';
  if (/recibo|firm|sueldo/.test(text)) return 'recibo';
  if (/certific|ausen|enferm|licencia|falta/.test(text)) return 'cert';
  if (/tarjeta|debito|banco/.test(text)) return 'tarjeta';
  return null;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const shortDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Día del mes en que se acredita el sueldo (ejemplo). */
const PAY_DAY = 5;

export interface Payday {
  /** "05 de diciembre". */
  readonly label: string;
  /** "en 29 días", "mañana" u "hoy". */
  readonly countdown: string;
}

/** Próximo cobro: el día 5 de este mes o, si ya pasó, del siguiente. */
export function nextPayday(today: Date): Payday {
  const day = startOfDay(today);
  let date = new Date(day.getFullYear(), day.getMonth(), PAY_DAY);
  if (date < day) date = new Date(day.getFullYear(), day.getMonth() + 1, PAY_DAY);
  const days = Math.round((date.getTime() - day.getTime()) / DAY_MS);
  return {
    label: `${String(PAY_DAY).padStart(2, '0')} de ${MONTHS[date.getMonth()]}`,
    countdown: days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`,
  };
}

export interface Receipt {
  readonly id: string;
  readonly title: string;
  /** Fecha en que se firmó; null si falta firmarlo. */
  readonly signedOn: string | null;
}

/** Recibos de los dos últimos meses: el último, listo para firmar. */
export function latestReceipts(today: Date): Receipt[] {
  const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previous = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  return [
    { id: `${last.getFullYear()}-${last.getMonth() + 1}`, title: `Recibo de ${MONTHS[last.getMonth()]}`, signedOn: null },
    {
      id: `${previous.getFullYear()}-${previous.getMonth() + 1}`,
      title: `Recibo de ${MONTHS[previous.getMonth()]}`,
      signedOn: shortDate(new Date(last.getFullYear(), last.getMonth(), 6)),
    },
  ];
}

/** Seguimiento de la tarjeta de débito: pedida hace un mes, llega en unos días. */
export function cardSteps(today: Date): TrackerStep[] {
  return [
    { label: 'Pedido de tarjeta', when: shortDate(addDays(today, -32)), state: 'done' },
    { label: 'Emitida por el banco', when: shortDate(addDays(today, -25)), state: 'done' },
    { label: 'En camino a tu sucursal', when: `llega el ${shortDate(addDays(today, 3))}`, state: 'now' },
    { label: 'Retirala con tu DNI', when: '—', state: 'next' },
  ];
}

/** Lo que la IA "lee" del certificado que sube el colaborador (ejemplo). */
export function readCertificate(today: Date): string {
  const from = addDays(today, -2);
  const to = addDays(today, -1);
  return `certificado médico · 2 días (${shortDate(from)} y ${shortDate(to)})`;
}

/** Atención al colaborador (dato de la maqueta). */
export const COLLABORATOR_PHONE = '(+54 9) 11-3853-5542';
