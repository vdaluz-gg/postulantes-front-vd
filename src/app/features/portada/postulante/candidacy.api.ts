import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, switchMap, timer } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api';

/** Datos de contacto del postulante (los completa la IA desde el CV y la persona los revisa). */
export interface CandidateContact {
  readonly fullName: string;
  readonly email: string;
  readonly dni: string;
  readonly whatsapp: string;
  readonly zone: string;
  readonly position: string;
}

/** Resultado de leer el CV: el archivo queda guardado con `cvId` y vuelven los datos que se pudieron extraer. */
export interface CvReading {
  readonly cvId: string | null;
  readonly prefill: Partial<Omit<CandidateContact, 'position'>>;
}

/** A qué se postula y con qué CV. */
export interface ApplicationTarget {
  /** Código de la oferta; sin él es una postulación espontánea. */
  readonly offerRef?: string;
  readonly cvId?: string | null;
}

/** Comprobante de la postulación. */
export interface ApplicationReceipt {
  /** Código para seguir la postulación (GG-XXXXXX); null en el mock. */
  readonly trackingCode: string | null;
  readonly position: string;
}

/** Tipos de archivo aceptados para el CV y tamaño máximo. */
export const CV_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const CV_MAX_BYTES = 5 * 1024 * 1024;

/** Postulación desde la portada: lectura del CV con IA y envío de los datos. */
@Injectable({ providedIn: 'root', useFactory: () => new MockCandidacyApi() })
export abstract class CandidacyApi {
  /** Guarda el CV, lo lee con IA y devuelve los datos de contacto que pudo extraer. */
  abstract readCv(file: File): Observable<CvReading>;
  /** Envía la postulación. */
  abstract apply(contact: CandidateContact, target: ApplicationTarget): Observable<ApplicationReceipt>;
}

/** Demora con la que el mock simula la lectura del CV. */
const READ_MS = 1300;

/** Mock: responde siempre con el CV de ejemplo de la maqueta. */
@Injectable()
export class MockCandidacyApi extends CandidacyApi {
  readCv(): Observable<CvReading> {
    return timer(READ_MS).pipe(
      map(() => ({
        cvId: null,
        prefill: { fullName: 'Martina Rodríguez', dni: '38.412.907', whatsapp: '11 5555-0142', zone: 'Monte Grande' },
      })),
    );
  }

  apply(contact: CandidateContact): Observable<ApplicationReceipt> {
    return of({ trackingCode: null, position: contact.position });
  }
}

/** Respuesta de `POST /cv`. */
interface CvUploadResponse {
  readonly cvId: string;
  readonly prefill: Record<string, string>;
}

/** Respuesta de `POST /applications`. */
interface ApplyResponse {
  readonly trackingCode: string;
  readonly position: string;
}

interface Zone {
  readonly id: string;
  readonly name: string;
}

/** Compara nombres de zona sin tildes, mayúsculas ni espacios de más. */
export const zoneKey = (name: string): string =>
  name.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Backend: `POST /cv` guarda el archivo y lo lee; `POST /applications` guarda al postulante y su
 * postulación, vinculada al CV. La zona se envía como `zoneId` cuando coincide con una zona activa.
 */
@Injectable()
export class HttpCandidacyApi extends CandidacyApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private zones: Observable<ReadonlyMap<string, string>> | null = null;

  readCv(file: File): Observable<CvReading> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<CvUploadResponse>(`${this.base}/cv`, body).pipe(
      map(({ cvId, prefill }) => ({
        cvId,
        prefill: {
          ...(prefill['fullName'] && { fullName: prefill['fullName'] }),
          ...(prefill['email'] && { email: prefill['email'] }),
          ...(prefill['dni'] && { dni: prefill['dni'] }),
          ...(prefill['whatsapp'] && { whatsapp: prefill['whatsapp'] }),
          ...(prefill['zone'] && { zone: prefill['zone'] }),
        },
      })),
    );
  }

  apply(contact: CandidateContact, target: ApplicationTarget): Observable<ApplicationReceipt> {
    return this.zoneId(contact.zone).pipe(
      switchMap((zoneId) =>
        this.http.post<ApplyResponse>(`${this.base}/applications`, {
          fullName: contact.fullName,
          email: contact.email,
          dni: contact.dni,
          whatsapp: contact.whatsapp,
          position: contact.position,
          channel: 'new_web',
          ...(zoneId && { zoneId }),
          ...(target.offerRef && { offerCode: target.offerRef }),
          ...(target.cvId && { cvId: target.cvId }),
        }),
      ),
      map(({ trackingCode, position }) => ({ trackingCode, position })),
    );
  }

  /** Zona escrita → id de zona activa. Si la lista no carga, se postula igual sin zona. */
  private zoneId(name: string): Observable<string | null> {
    this.zones ??= this.http.get<readonly Zone[]>(`${this.base}/zones`).pipe(
      map((zones) => new Map(zones.map((z) => [zoneKey(z.name), z.id]))),
      catchError(() => {
        this.zones = null;
        return of(new Map<string, string>());
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.zones.pipe(map((zones) => zones.get(zoneKey(name)) ?? null));
  }
}
