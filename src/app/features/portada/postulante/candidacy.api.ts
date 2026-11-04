import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/** Datos de contacto del postulante (los completa la IA desde el CV y la persona los revisa). */
export interface CandidateContact {
  readonly fullName: string;
  readonly dni: string;
  readonly whatsapp: string;
  readonly zone: string;
  readonly position: string;
}

/** Tipos de archivo aceptados para el CV y tamaño máximo. */
export const CV_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const CV_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Contrato de la postulación desde la portada. Hoy lo cumple un mock; la versión HTTP subirá el CV
 * al servicio de IA y enviará la postulación sin cambiar componentes.
 */
@Injectable({ providedIn: 'root', useFactory: () => new MockCandidacyApi() })
export abstract class CandidacyApi {
  /** Lee el CV con IA y devuelve los datos de contacto que pudo extraer. */
  abstract readCv(file: File): Observable<Omit<CandidateContact, 'position'>>;
  /** Envía la postulación. */
  abstract apply(contact: CandidateContact): Observable<void>;
}

/** Demora con la que el mock simula la lectura del CV. */
const READ_MS = 1300;

/** Mock: responde siempre con el CV de ejemplo de la maqueta. */
export class MockCandidacyApi extends CandidacyApi {
  readCv(): Observable<Omit<CandidateContact, 'position'>> {
    return timer(READ_MS).pipe(
      map(() => ({ fullName: 'Martina Rodríguez', dni: '38.412.907', whatsapp: '11 5555-0142', zone: 'Monte Grande' })),
    );
  }

  apply(): Observable<void> {
    return of(undefined);
  }
}
