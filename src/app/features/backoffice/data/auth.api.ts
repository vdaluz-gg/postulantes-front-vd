import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { API_BASE_URL, ApiError } from '../../../core/api/api';

/**
 * Roles del backoffice. El backend hoy tiene `admin` y `superadmin`; `marketing` es el rol que
 * pidió el equipo y todavía no existe del lado del servidor.
 */
export type AdminRole = 'superadmin' | 'admin' | 'marketing';

/** Mismo formato que `AdminProfileDto` del backend. */
export interface AdminProfile {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: AdminRole;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly admin: AdminProfile;
}

/** Ingreso al backoffice. La implementación HTTP sigue `POST /auth/login` y `GET /auth/me`. */
@Injectable({ providedIn: 'root', useFactory: () => new MockAuthApi() })
export abstract class AuthApi {
  abstract login(email: string, password: string): Observable<LoginResponse>;
}

@Injectable()
export class HttpAuthApi extends AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password });
  }
}

/** Usuarios de prueba. La contraseña cumple la regla del backend (10+, mayúscula, minúscula y número). */
export const DEMO_USERS: readonly (AdminProfile & { readonly password: string })[] = [
  { id: 'demo-marketing', email: 'marketing@ejemplo.com', fullName: 'Equipo de Marketing', role: 'marketing', password: 'Marketing2026' },
  { id: 'demo-admin', email: 'admin@ejemplo.com', fullName: 'Administración', role: 'admin', password: 'Backoffice2026' },
];

const MOCK_DELAY_MS = 600;

@Injectable()
export class MockAuthApi extends AuthApi {
  login(email: string, password: string): Observable<LoginResponse> {
    const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) {
      const error: ApiError = { statusCode: 401, error: 'Unauthorized', message: 'Credenciales inválidas' };
      return throwError(() => error).pipe(delay(MOCK_DELAY_MS));
    }
    const { password: _, ...admin } = user;
    return of({ accessToken: `mock.${admin.id}`, admin }).pipe(delay(MOCK_DELAY_MS));
  }
}
