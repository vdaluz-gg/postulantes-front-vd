import { Observable } from 'rxjs';
import {
  Application,
  CandidateDocument,
  CandidateProfile,
  InboxMessage,
  Interview,
  JobOpening,
} from '../models';

/**
 * Contratos de datos del portal del postulante. Cada uno se implementa hoy con un mock
 * (mock/mock-postulante.apis.ts) y mañana con su versión HTTP, sin tocar componentes ni store.
 */

export abstract class ProfileApi {
  abstract get(): Observable<CandidateProfile>;
}

export abstract class ApplicationsApi {
  abstract list(): Observable<Application[]>;
}

export abstract class InterviewsApi {
  abstract list(): Observable<Interview[]>;
  /** Confirma la asistencia a una entrevista pendiente. */
  abstract confirm(id: string): Observable<void>;
  /** Pide pasar la entrevista a otro horario; la selectora responde por correo y WhatsApp. */
  abstract requestReschedule(id: string, slot: Date, reason: string): Observable<void>;
}

export abstract class DocumentsApi {
  abstract list(): Observable<CandidateDocument[]>;
}

export abstract class MessagesApi {
  abstract list(): Observable<InboxMessage[]>;
}

export abstract class JobsApi {
  /** Búsquedas abiertas con la afinidad que calcula la IA para este postulante. */
  abstract catalog(): Observable<JobOpening[]>;
}
