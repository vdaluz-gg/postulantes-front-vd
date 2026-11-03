/** Evento de calendario en formato iCalendar (.ics), compatible con Google, Outlook y Apple. */
export interface CalendarEvent {
  readonly uid: string;
  readonly start: Date;
  readonly durationMin: number;
  readonly summary: string;
  readonly description: string;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const end = new Date(event.start.getTime() + event.durationMin * 60_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grupo Gestion//Portal//ES',
    'BEGIN:VEVENT',
    `UID:${event.uid}@grupo-gestion`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${event.summary}`,
    `DESCRIPTION:${event.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
