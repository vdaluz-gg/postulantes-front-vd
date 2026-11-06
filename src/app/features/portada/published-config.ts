import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api';
import { STORAGE_KEYS, StorageService } from '../../core/services/storage.service';
import {
  APPLICATION_SECTION,
  AlertConfig,
  Audience,
  AudienceConfig,
  CopyConfig,
  FieldConfig,
  SiteConfig,
} from '../backoffice/data/site-config.model';
import { SITE_CONFIG_SEED } from '../backoffice/data/site-config.seed';
import { Persona } from './portada.data';

/** Lo que publicó el backoffice para cada portal. */
@Injectable({ providedIn: 'root', useFactory: () => new MockPublishedConfigApi() })
export abstract class PublishedConfigApi {
  abstract audience(audience: Audience): Observable<AudienceConfig>;
}

/** Backend: `GET /site-config/:audience`. Si todavía no se publicó nada o no responde, vale la configuración inicial. */
@Injectable()
export class HttpPublishedConfigApi extends PublishedConfigApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  audience(audience: Audience): Observable<AudienceConfig> {
    return this.http
      .get<AudienceConfig>(`${this.base}/site-config/${audience}`)
      .pipe(catchError(() => of(SITE_CONFIG_SEED.audiences[audience])));
  }
}

/** Sin backend: lo que publicó el backoffice simulado en este navegador. */
@Injectable()
export class MockPublishedConfigApi extends PublishedConfigApi {
  private readonly storage = inject(StorageService);

  audience(audience: Audience): Observable<AudienceConfig> {
    const stored = this.storage.getJson<{ published?: SiteConfig }>(STORAGE_KEYS.backofficeConfig);
    return of((stored?.published ?? SITE_CONFIG_SEED).audiences[audience]);
  }
}

/** Fecha local en formato AAAA-MM-DD, como las fechas de los avisos. */
export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Avisos activos, con mensaje y dentro de sus fechas. */
export const activeAlerts = (alerts: readonly AlertConfig[], today: string): AlertConfig[] =>
  alerts.filter((a) => a.active && a.message.trim() && (!a.startsOn || a.startsOn <= today) && (!a.endsOn || today <= a.endsOn));

/**
 * Textos publicados aplicados a un perfil. El título se parte en la última coma: lo que sigue va
 * resaltado ("El trabajo de la Argentina, *en movimiento.*").
 */
export function withCopy(persona: Persona, copy: readonly CopyConfig[]): Persona {
  const text = (id: string) => copy.find((c) => c.id === id)?.value.trim() || null;
  const title = text('title');
  const cut = title ? title.lastIndexOf(',') : -1;
  const suggestions = text('suggestions')
    ?.split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ...persona,
    kicker: text('kicker') ?? persona.kicker,
    ...(title && { title: cut > 0 ? title.slice(0, cut + 1) : title, highlight: cut > 0 ? title.slice(cut + 1).trim() : '' }),
    prompt: { ...persona.prompt, placeholder: text('searchPlaceholder') ?? persona.prompt.placeholder },
    suggestions: suggestions?.length ? suggestions : persona.suggestions,
    footnote: text('footnote') ?? persona.footnote,
  };
}

const SEED_APPLICATION = SITE_CONFIG_SEED.audiences.postulantes.sections.find((s) => s.id === APPLICATION_SECTION)!;

/**
 * Configuración publicada para postulantes, lista para la portada: textos del panel, avisos y campos
 * del formulario de postulación. La portada la vuelve a pedir cada vez que se abre.
 */
@Injectable({ providedIn: 'root' })
export class PortadaConfig {
  private readonly api = inject(PublishedConfigApi);

  readonly postulantes = signal<AudienceConfig>(SITE_CONFIG_SEED.audiences.postulantes);
  readonly applicationFields = computed<readonly FieldConfig[]>(
    () => this.postulantes().sections.find((s) => s.id === APPLICATION_SECTION)?.fields ?? SEED_APPLICATION.fields,
  );
  readonly alerts = computed(() => activeAlerts(this.postulantes().alerts, localDate()));

  load(): Subscription {
    return this.api.audience('postulantes').subscribe((config) => this.postulantes.set(config));
  }
}
