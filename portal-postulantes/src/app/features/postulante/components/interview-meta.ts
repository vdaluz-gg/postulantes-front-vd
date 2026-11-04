import { ChipTone, InterviewStatus, InterviewType } from '../../../core/models';
import type { IconName } from '../../../shared/ui/atoms/icon/icons';

/** Etiqueta, ícono y punto de calendario de cada tipo de entrevista. */
export const INTERVIEW_TYPE_META: Record<InterviewType, { label: string; icon: IconName; dot: '' | 'a' | 'p' }> = {
  recruiter: { label: 'Selectora · Teams', icon: 'video', dot: '' },
  agent: { label: 'Agente de IA', icon: 'bot', dot: 'a' },
  onsite: { label: 'Presencial', icon: 'pin', dot: 'p' },
};

/** Chip de estado de una entrevista: color, ícono y texto (nunca solo color). */
export const INTERVIEW_STATUS_META: Record<InterviewStatus, { tone: ChipTone; label: string; icon: IconName }> = {
  confirmed: { tone: 'ok', label: 'Confirmada', icon: 'check' },
  pending: { tone: 'warn', label: 'Falta confirmar', icon: 'alert' },
  'reschedule-requested': { tone: 'vio', label: 'Reprogramación pedida', icon: 'clock' },
  done: { tone: '', label: 'Realizada', icon: 'check' },
};
