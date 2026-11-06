import { Provider } from '@angular/core';
import { AuthApi, HttpAuthApi } from './features/backoffice/data/auth.api';
import { CandidacyApi, HttpCandidacyApi } from './features/portada/postulante/candidacy.api';
import { HttpOffersApi, OffersApi } from './features/portada/postulante/offers.api';

/**
 * Conexión con postulantes-back-vd (API_BASE_URL). En false, todo funciona con los mocks.
 * La configuración del backoffice sigue simulada: el backend todavía no tiene esos endpoints.
 */
export const USE_BACKEND = true;

export function provideBackendApis(): Provider[] {
  if (!USE_BACKEND) return [];
  return [
    { provide: OffersApi, useClass: HttpOffersApi },
    { provide: CandidacyApi, useClass: HttpCandidacyApi },
    { provide: AuthApi, useClass: HttpAuthApi },
  ];
}
