import type { ChipTone } from './application.model';

export type InterviewType = 'recruiter' | 'agent' | 'onsite';
export type InterviewStatus = 'confirmed' | 'pending' | 'reschedule-requested' | 'done';

export interface Interview {
  readonly id: string;
  readonly type: InterviewType;
  readonly applicationId: string;
  readonly title: string;
  readonly with: string;
  readonly startsAt: Date;
  readonly durationMin: number;
  readonly status: InterviewStatus;
  readonly rescheduleRequestedFor?: Date;
  /** Link de Microsoft Teams. Cuando el backend lo provea, "Unirme" lo abre directamente. */
  readonly meetingUrl?: string;
}

/** Minutos antes del inicio en que se habilita la sala de Teams. */
export const MEETING_ROOM_OPENS_MIN = 15;

export const interviewEndsAt = (i: Interview): number => i.startsAt.getTime() + i.durationMin * 60_000;

export const isUpcoming = (i: Interview, now: number): boolean => i.status !== 'done' && interviewEndsAt(i) > now;

export const isMeetingRoomOpen = (i: Interview, now: number): boolean =>
  now >= i.startsAt.getTime() - MEETING_ROOM_OPENS_MIN * 60_000 && now <= interviewEndsAt(i);

export const interviewTypeTone = (i: Interview): ChipTone => (i.type === 'recruiter' ? 'vio' : 'ok');

/** Nombre corto para frases ("con Mariana", "con la selectora"). */
export const interviewerShortName = (i: Interview): string =>
  /^Selectora de/.test(i.with) ? 'la selectora' : i.with.split(' ')[0];
