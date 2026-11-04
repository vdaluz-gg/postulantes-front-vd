import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

/** Solo deja pasar con sesión iniciada; si no, lleva al acceso. */
export const authGuard: CanActivateFn = () =>
  inject(SessionService).authenticated() || inject(Router).createUrlTree(['/postulante/ingresar']);

/** Evita mostrar el acceso a quien ya tiene sesión. */
export const guestGuard: CanActivateFn = () =>
  !inject(SessionService).authenticated() || inject(Router).createUrlTree(['/postulante/inicio']);
