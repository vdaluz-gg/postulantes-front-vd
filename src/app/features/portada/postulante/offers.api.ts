import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { API_BASE_URL, Page } from '../../../core/api/api';
import { JobOffersResponse, JobPosting, toJobPosting } from './job-offer';

/** Ofertas simuladas, servidas desde public/. */
export const OFFERS_URL = 'mock/ofertas.json';
/** Máximo de ofertas por pedido que acepta el backend. */
const OFFERS_LIMIT = 100;

/** Ofertas publicadas para la portada. */
@Injectable({ providedIn: 'root', useFactory: () => new MockOffersApi() })
export abstract class OffersApi {
  abstract list(): Observable<readonly JobPosting[]>;
}

/** Se piden una vez y quedan en memoria; si la carga falla, se reintenta en el próximo pedido. */
abstract class CachedOffersApi extends OffersApi {
  private cache: Observable<readonly JobPosting[]> | null = null;

  protected abstract fetch(): Observable<readonly JobPosting[]>;

  list(): Observable<readonly JobPosting[]> {
    this.cache ??= this.fetch().pipe(
      catchError((error: unknown) => {
        this.cache = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.cache;
  }
}

/** Mock: la ficha completa del JSON, mapeada a lo que ve el postulante. */
@Injectable()
export class MockOffersApi extends CachedOffersApi {
  private readonly http = inject(HttpClient);

  protected fetch(): Observable<readonly JobPosting[]> {
    return this.http.get<JobOffersResponse>(OFFERS_URL).pipe(map((response) => response.ofertas.map(toJobPosting)));
  }
}

/** Backend: `GET /job-offers` ya devuelve solo los datos públicos, con los nombres de JobPosting. */
@Injectable()
export class HttpOffersApi extends CachedOffersApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  protected fetch(): Observable<readonly JobPosting[]> {
    return this.http
      .get<Page<JobPosting>>(`${this.base}/job-offers`, { params: { limit: OFFERS_LIMIT } })
      .pipe(map((page) => page.items));
  }
}
