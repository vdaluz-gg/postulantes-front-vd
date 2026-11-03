/** Etapas: 1 Postulación, 2 Agente IA, 3 Selectora, 4 Resultado. */
export type ApplicationStage = 1 | 2 | 3 | 4;

export const APPLICATION_STAGES = ['Postulación', 'Agente IA', 'Selectora', 'Resultado'] as const;

export interface ApplicationHistoryEntry {
  readonly at: Date;
  readonly text: string;
}

export interface Application {
  readonly id: string;
  readonly jobId: number;
  readonly ref: string;
  readonly title: string;
  readonly zone: string;
  readonly area: string;
  readonly stage: ApplicationStage;
  readonly match: number | null;
  readonly status: string;
  readonly appliedAt: Date;
  readonly history: readonly ApplicationHistoryEntry[];
  readonly nextStep: string;
  /** Solo presente cuando la búsqueda terminó sin avance. */
  readonly outcome?: 'rejected';
}

export type ApplicationFilter = 'active' | 'finished';

/** Tono visual compartido por los chips de estado. */
export type ChipTone = '' | 'ok' | 'warn' | 'vio';

export type StepState = 'done' | 'now' | 'pend' | 'bad';

export const isActiveApplication = (app: Application): boolean => app.outcome !== 'rejected';

/** Tono del chip de estado de una postulación. */
export function applicationStatusTone(app: Application): ChipTone {
  if (!isActiveApplication(app)) return '';
  return app.status.startsWith('Confirm') || app.status.includes('Falta tu') ? 'warn' : 'ok';
}

/** Estado de cada paso del stepper (índice 0 a 3). */
export function stepState(app: Application, index: number): StepState {
  const step = index + 1;
  if (app.stage === 4 && step === 4) return app.outcome === 'rejected' ? 'bad' : 'done';
  if (step < app.stage) return 'done';
  return step === app.stage ? 'now' : 'pend';
}
