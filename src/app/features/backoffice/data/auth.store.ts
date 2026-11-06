import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiError } from '../../../core/api/api';
import { STORAGE_KEYS, StorageService } from '../../../core/services/storage.service';
import { AdminProfile, AuthApi, LoginResponse } from './auth.api';

/** El servidor rechazó el token: vencido, inválido o de una cuenta dada de baja. */
const isUnauthorized = (error: unknown): boolean =>
  (error instanceof HttpErrorResponse
    ? error.status
    : (error as Partial<ApiError> | null)?.statusCode) === 401;

/** Sesión del backoffice. Vive en sessionStorage: se cierra al cerrar la pestaña. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(StorageService);
  private readonly session = signal<LoginResponse | null>(
    this.storage.getSessionJson<LoginResponse>(STORAGE_KEYS.backofficeSession),
  );
  /** El token ya se confirmó con el servidor en esta carga de la app. */
  private verified = false;

  readonly admin = computed<AdminProfile | null>(() => this.session()?.admin ?? null);
  readonly loggedIn = computed(() => this.session() !== null);
  /** La sesión se cerró porque el servidor ya no acepta el token. */
  readonly expired = signal(false);
  readonly token = () => this.session()?.accessToken ?? null;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.login(email, password).pipe(
      tap((response) => {
        this.save(response);
        this.verified = true;
        this.expired.set(false);
      }),
    );
  }

  /**
   * Confirma con el servidor que la sesión guardada sigue valiendo y actualiza el perfil.
   * Si el servidor no responde, deja pasar: la API igual rechaza lo que no corresponda.
   */
  verify(): Observable<boolean> {
    const current = this.session();
    if (!current) return of(false);
    if (this.verified) return of(true);
    return this.api.me(current.accessToken).pipe(
      map((admin) => {
        this.save({ ...current, admin });
        this.verified = true;
        return true;
      }),
      catchError((error: unknown) => {
        if (!isUnauthorized(error)) return of(true);
        this.expire();
        return of(false);
      }),
    );
  }

  logout(): void {
    this.clear();
    this.expired.set(false);
  }

  /** Cierra la sesión porque el token dejó de servir (lo avisa el interceptor o la verificación). */
  expire(): void {
    if (!this.session()) return;
    this.clear();
    this.expired.set(true);
  }

  private save(response: LoginResponse): void {
    this.session.set(response);
    this.storage.setSession(STORAGE_KEYS.backofficeSession, JSON.stringify(response));
  }

  private clear(): void {
    this.session.set(null);
    this.verified = false;
    this.storage.removeSession(STORAGE_KEYS.backofficeSession);
  }
}

export const LOGIN_PATH = '/backoffice/ingresar';

/** Sin sesión válida, manda al ingreso y recuerda a dónde quería ir. */
export const backofficeAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const toLogin = inject(Router).createUrlTree([LOGIN_PATH], {
    queryParams: { volver: state.url },
  });
  if (!auth.loggedIn()) return toLogin;
  return auth.verify().pipe(map((ok) => ok || toLogin));
};
