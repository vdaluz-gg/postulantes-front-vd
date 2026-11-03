import { buildIcs } from './ics';
import { countdown, dayDiff, formatDate, relativeDay } from './date-format';

const NOW = new Date(2026, 10, 3, 12, 0).getTime();

describe('date-format (es-AR)', () => {
  const friday = new Date(2026, 10, 6, 10, 0);

  it('formatea fechas y horas como la maqueta', () => {
    expect(formatDate(new Date(NOW), 'dayLong')).toBe('Martes, 3 de noviembre');
    expect(formatDate(friday, 'dayShort')).toBe('vie, 6 nov');
    expect(formatDate(friday, 'weekday')).toBe('viernes');
    expect(formatDate(friday, 'monthShort')).toBe('nov');
    expect(formatDate(friday, 'time')).toBe('10:00');
  });

  it('expresa días relativos', () => {
    expect(dayDiff(friday, NOW)).toBe(3);
    expect(relativeDay(new Date(2026, 10, 3, 20), NOW)).toBe('hoy');
    expect(relativeDay(new Date(2026, 10, 4), NOW)).toBe('mañana');
    expect(relativeDay(new Date(2026, 10, 2), NOW)).toBe('ayer');
    expect(relativeDay(friday, NOW)).toBe('en 3 días');
    expect(relativeDay(new Date(2026, 9, 30), NOW)).toBe('hace 4 días');
  });

  it('arma la cuenta regresiva', () => {
    expect(countdown(new Date(NOW + 40 * 60_000), NOW)).toBe('en 40 min');
    expect(countdown(new Date(NOW + 5 * 3_600_000), NOW)).toBe('en 5 h');
    expect(countdown(friday, NOW)).toBe('en 3 días');
    expect(countdown(new Date(NOW - 1), NOW)).toBe('en curso');
  });
});

describe('ics', () => {
  it('genera un evento iCalendar con inicio y fin', () => {
    const ics = buildIcs(
      { uid: 'e1', start: new Date(Date.UTC(2026, 10, 6, 13)), durationMin: 30, summary: 'Entrevista', description: 'Con Mariana.' },
      new Date(Date.UTC(2026, 10, 3, 15)),
    );
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:e1@grupo-gestion');
    expect(ics).toContain('DTSTART:20261106T130000Z');
    expect(ics).toContain('DTEND:20261106T133000Z');
    expect(ics.split('\r\n')).toHaveLength(12);
  });
});
