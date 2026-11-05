import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { STORAGE_KEYS, StorageService } from '../../../core/services/storage.service';
import { AdminProfile, AuthApi, LoginResponse } from './auth.api';

/** Sesión del backoffice. Vive en sessionStorage: se cierra al cerrar la pestaña. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(StorageService);
  private readonly session = signal<LoginResponse | null>(this.storage.getSessionJson<LoginResponse>(STORAGE_KEYS.backofficeSession));

  readonly admin = computed<AdminProfile | null>(() => this.session()?.admin ?? null);
  readonly loggedIn = computed(() => this.session() !== null);
  readonly token = () => this.session()?.accessToken ?? null;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.login(email, password).pipe(
      tap((response) => {
        this.session.set(response);
        this.storage.setSession(STORAGE_KEYS.backofficeSession, JSON.stringify(response));
      }),
    );
  }

  logout(): void {
    this.session.set(null);
    this.storage.removeSession(STORAGE_KEYS.backofficeSession);
  }
}

export const LOGIN_PATH = '/backoffice/ingresar';

/** Sin sesión, manda al ingreso y recuerda a dónde quería ir. */
export const backofficeAuthGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthStore).loggedIn()) return true;
  return inject(Router).createUrlTree([LOGIN_PATH], { queryParams: { volver: state.url } });
};
