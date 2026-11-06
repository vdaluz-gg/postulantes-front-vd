import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { API_BASE_URL, ApiError } from '../../../core/api/api';

/**
 * Roles del backoffice. El backend hoy tiene `admin` y `superadmin`; `marketing` es el rol que
 * pidió el equipo y todavía no existe del lado del servidor (las cuentas de marketing entran como `admin`).
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
  /** Perfil del dueño del token. Falla con 401 si el token venció o la cuenta se dio de baja. */
  abstract me(token: string): Observable<AdminProfile>;
}

@Injectable()
export class HttpAuthApi extends AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password });
  }

  me(token: string): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${this.base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  }
}

/**
 * Usuarios de prueba. La contraseña cumple la regla del backend (10+, mayúscula, minúscula y número).
 * Con el backend existen solo si se dieron de alta en esa base (ver README).
 */
export const DEMO_USERS: readonly (AdminProfile & { readonly password: string })[] = [
  { id: 'demo-marketing', email: 'marketing@ejemplo.com', fullName: 'Equipo de Marketing', role: 'marketing', password: 'Marketing2026' },
  { id: 'demo-admin', email: 'admin@ejemplo.com', fullName: 'Administración', role: 'admin', password: 'Backoffice2026' },
];

const MOCK_DELAY_MS = 600;
const unauthorized = (message: string): ApiError => ({ statusCode: 401, error: 'Unauthorized', message });

@Injectable()
export class MockAuthApi extends AuthApi {
  login(email: string, password: string): Observable<LoginResponse> {
    const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) return throwError(() => unauthorized('Credenciales inválidas')).pipe(delay(MOCK_DELAY_MS));
    const { password: _, ...admin } = user;
    return of({ accessToken: `mock.${admin.id}`, admin }).pipe(delay(MOCK_DELAY_MS));
  }

  me(token: string): Observable<AdminProfile> {
    const user = DEMO_USERS.find((u) => token === `mock.${u.id}`);
    if (!user) return throwError(() => unauthorized('Token inválido o vencido'));
    const { password: _, ...admin } = user;
    return of(admin);
  }
}
