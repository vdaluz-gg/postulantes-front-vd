import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { JobOffersResponse, JobPosting, toJobPosting } from './job-offer';

/**
 * Origen de las ofertas. Hoy es el mock servido desde public/; cuando esté la API alcanza con
 * cambiar esta URL (y, si cambia el formato, el mapeo en job-offer.ts).
 */
export const OFFERS_URL = 'mock/ofertas.json';

/** Ofertas publicadas. Se piden una vez y quedan en memoria; si la carga falla, se reintenta en el próximo pedido. */
@Injectable({ providedIn: 'root' })
export class OffersApi {
  private readonly http = inject(HttpClient);
  private cache: Observable<readonly JobPosting[]> | null = null;

  list(): Observable<readonly JobPosting[]> {
    this.cache ??= this.http.get<JobOffersResponse>(OFFERS_URL).pipe(
      map((response) => response.ofertas.map(toJobPosting)),
      catchError((error: unknown) => {
        this.cache = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.cache;
  }
}
