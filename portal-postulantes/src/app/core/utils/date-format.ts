/** Formatos de fecha y hora en español rioplatense (es-AR), horas en 24 h. */
const LOCALE = 'es-AR';
const DAY_MS = 86_400_000;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type DateFormat = 'dayLong' | 'dayShort' | 'weekday' | 'monthShort' | 'monthLong' | 'time';

export function formatDate(date: Date, format: DateFormat): string {
  switch (format) {
    case 'dayLong':
      return capitalize(date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }));
    case 'dayShort':
      return date.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
    case 'weekday':
      return date.toLocaleDateString(LOCALE, { weekday: 'long' });
    case 'monthShort':
      return date.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '');
    case 'monthLong':
      return capitalize(date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));
    case 'time':
      return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

/** Diferencia en días calendario entre la fecha y hoy (0 hoy, 1 mañana, -1 ayer). */
export function dayDiff(date: Date, now: number): number {
  const today = new Date(now);
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((a - b) / DAY_MS);
}

/** "hoy", "mañana", "ayer", "en 3 días", "hace 2 días". */
export function relativeDay(date: Date, now: number): string {
  const n = dayDiff(date, now);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}

/** Cuenta regresiva corta: "en 40 min", "en 5 h", "en 3 días" o "en curso". */
export function countdown(date: Date, now: number): string {
  const ms = date.getTime() - now;
  if (ms < 0) return 'en curso';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `en ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `en ${hours} h`;
  return relativeDay(date, now);
}

export const capitalizeFirst = capitalize;
