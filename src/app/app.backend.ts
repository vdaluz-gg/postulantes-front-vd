import { Provider } from '@angular/core';
import { AuthApi, HttpAuthApi } from './features/backoffice/data/auth.api';
import { HttpSiteConfigApi, SiteConfigApi } from './features/backoffice/data/site-config.api';
import { CandidacyApi, HttpCandidacyApi } from './features/portada/postulante/candidacy.api';
import { HttpOffersApi, OffersApi } from './features/portada/postulante/offers.api';
import { HttpPublishedConfigApi, PublishedConfigApi } from './features/portada/published-config';

/**
 * Conexión con postulantes-back-vd (API_BASE_URL). En false, todo funciona con los mocks.
 */
export const USE_BACKEND = true;

export function provideBackendApis(): Provider[] {
  if (!USE_BACKEND) return [];
  return [
    { provide: OffersApi, useClass: HttpOffersApi },
    { provide: CandidacyApi, useClass: HttpCandidacyApi },
    { provide: AuthApi, useClass: HttpAuthApi },
    { provide: SiteConfigApi, useClass: HttpSiteConfigApi },
    { provide: PublishedConfigApi, useClass: HttpPublishedConfigApi },
  ];
}
