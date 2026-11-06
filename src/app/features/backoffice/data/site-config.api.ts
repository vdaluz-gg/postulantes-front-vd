import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api';
import { STORAGE_KEYS, StorageService } from '../../../core/services/storage.service';
import { SiteConfig } from './site-config.model';
import { SITE_CONFIG_SEED } from './site-config.seed';

/**
 * Lectura y guardado de la configuración. Con backend usa los endpoints de site-config.model.ts;
 * sin backend se simula en el navegador.
 */
@Injectable({ providedIn: 'root', useFactory: () => new MockSiteConfigApi() })
export abstract class SiteConfigApi {
  /** Último borrador, o lo publicado si no hay borrador. */
  abstract load(): Observable<SiteConfig>;
  /** Guarda el borrador. El servidor asigna versión, fecha y autor. */
  abstract save(config: SiteConfig, author: string): Observable<SiteConfig>;
  /** Publica el borrador: desde ese momento lo ven los portales. */
  abstract publish(config: SiteConfig, author: string): Observable<SiteConfig>;
}

@Injectable()
export class HttpSiteConfigApi extends SiteConfigApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/backoffice/site-config`;

  /** Si todavía no se guardó nada (404), se arranca de la configuración inicial. */
  load(): Observable<SiteConfig> {
    return this.http
      .get<SiteConfig>(this.base)
      .pipe(
        catchError((e: unknown) =>
          e instanceof HttpErrorResponse && e.status === 404
            ? of(SITE_CONFIG_SEED)
            : throwError(() => e),
        ),
      );
  }

  save(config: SiteConfig): Observable<SiteConfig> {
    return this.http.put<SiteConfig>(this.base, config);
  }

  publish(config: SiteConfig): Observable<SiteConfig> {
    return this.http.post<SiteConfig>(`${this.base}/publish`, config);
  }
}

interface StoredConfig {
  readonly draft: SiteConfig | null;
  readonly published: SiteConfig;
}

const MOCK_DELAY_MS = 400;

@Injectable()
export class MockSiteConfigApi extends SiteConfigApi {
  private readonly storage = inject(StorageService);

  load(): Observable<SiteConfig> {
    const stored = this.read();
    return of(stored.draft ?? stored.published).pipe(delay(MOCK_DELAY_MS));
  }

  save(config: SiteConfig, author: string): Observable<SiteConfig> {
    const draft = this.stamp(config, 'draft', author);
    this.write({ ...this.read(), draft });
    return of(draft).pipe(delay(MOCK_DELAY_MS));
  }

  publish(config: SiteConfig, author: string): Observable<SiteConfig> {
    const published = this.stamp(config, 'published', author);
    this.write({ draft: null, published });
    return of(published).pipe(delay(MOCK_DELAY_MS));
  }

  private stamp(config: SiteConfig, status: SiteConfig['status'], author: string): SiteConfig {
    const current = this.read();
    const version = Math.max(current.published.version, current.draft?.version ?? 0) + 1;
    return { ...config, status, version, updatedAt: new Date().toISOString(), updatedBy: author };
  }

  private read(): StoredConfig {
    return (
      this.storage.getJson<StoredConfig>(STORAGE_KEYS.backofficeConfig) ?? {
        draft: null,
        published: SITE_CONFIG_SEED,
      }
    );
  }

  private write(value: StoredConfig): void {
    this.storage.set(STORAGE_KEYS.backofficeConfig, JSON.stringify(value));
  }
}
