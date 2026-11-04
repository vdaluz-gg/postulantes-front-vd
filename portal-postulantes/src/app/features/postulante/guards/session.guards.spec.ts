import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { authGuard, guestGuard } from './session.guards';

const run = (guard: typeof authGuard) =>
  TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

describe('guards de sesión', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sin sesión: el portal lleva al acceso y el acceso se muestra', () => {
    const toLogin = run(authGuard) as UrlTree;
    expect(toLogin.toString()).toBe('/postulante/ingresar');
    expect(run(guestGuard)).toBe(true);
  });

  it('con sesión: el portal se muestra y el acceso lleva al inicio', () => {
    TestBed.inject(SessionService).start('camila@ejemplo.com');
    expect(run(authGuard)).toBe(true);
    expect((run(guestGuard) as UrlTree).toString()).toBe('/postulante/inicio');
  });
});
