import { CandidateDocument, Interview, interviewerShortName } from '../../../../core/models';
import { capitalizeFirst, formatDate, relativeDay } from '../../../../core/utils/date-format';
import type { IconName } from '../../../../shared/ui/atoms/icon/icons';

/** Tramo del resumen del hero; los datos clave van en negrita. */
export interface LeadSegment {
  readonly text: string;
  readonly strong?: boolean;
}

export type TodoAction = 'confirm' | 'documents' | 'agent' | 'profile';

export interface HomeTodo {
  readonly id: TodoAction;
  readonly icon: IconName;
  readonly heading: string;
  readonly detail: string;
  readonly actionLabel: string;
  /** Al resolverse, la fila se tilda y desaparece. */
  readonly completes: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Resumen del hero: lo próximo con una persona y los documentos que faltan. */
export function buildLead(next: Interview | null, missing: readonly CandidateDocument[], now: number): LeadSegment[] {
  const parts: LeadSegment[] = [];
  if (next?.type === 'recruiter') {
    parts.push(
      { text: `${capitalizeFirst(relativeDay(next.startsAt, now))} a las ` },
      { text: `${formatDate(next.startsAt, 'time')} h`, strong: true },
      { text: ' tenés tu entrevista con ' },
      { text: interviewerShortName(next), strong: true },
      { text: ' por Teams. ' },
    );
  }
  if (missing.length) {
    const n = missing.length;
    parts.push(
      { text: `Te ${plural(n, 'falta', 'faltan')} ` },
      { text: `${n} ${plural(n, 'documento', 'documentos')}`, strong: true },
      { text: ` para que ${plural(n, 'avance', 'avancen')} tus postulaciones.` },
    );
  }
  return parts.length ? parts : [{ text: 'Todo en orden. Te avisamos apenas haya novedades.' }];
}
