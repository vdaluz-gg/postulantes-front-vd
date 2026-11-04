import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideDataAccess } from '../../../core/data-access/provide-data-access';
import { MockDatabase } from '../../../core/data-access/mock/mock-postulante.apis';
import { SessionService } from '../../../core/services/session.service';
import { POSTULANTE_ROUTES } from '../postulante.routes';
import { PostulanteStore } from '../state/postulante.store';

const NOW = new Date(2026, 10, 3, 12, 0);

describe('PortalShellComponent', () => {
  let harness: RouterTestingHarness;
  let el: () => HTMLElement;

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['requestAnimationFrame', 'queueMicrotask', 'nextTick', 'setImmediate'] });
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideDataAccess(), provideRouter([{ path: 'postulante', children: POSTULANTE_ROUTES }], withComponentInputBinding())],
    });
    TestBed.inject(MockDatabase).reset(NOW);
    TestBed.inject(SessionService).start('camila.rojas@ejemplo.com');
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/postulante/inicio');
    el = () => harness.routeNativeElement!.ownerDocument.body;
  });

  afterEach(() => jest.useRealTimers());

  const navLinks = () => Array.from(el().querySelectorAll<HTMLAnchorElement>('.nav a'));

  it('muestra la marca con la pastilla del portal y las seis secciones', () => {
    expect(el().querySelector('app-brand small')!.textContent).toBe('Postulantes');
    expect(navLinks().map((a) => a.querySelector('.l-lg')!.textContent)).toEqual([
      'Inicio',
      'Postulaciones',
      'Calendario',
      'Ofertas para mí',
      'Mensajes y documentos',
      'Mi perfil',
    ]);
  });

  it('marca la sección actual con aria-current y tiene contadores con texto accesible', () => {
    expect(navLinks()[0].getAttribute('aria-current')).toBe('page');
    const counters = navLinks().map((a) => a.querySelector('.bd .sr')?.textContent ?? null);
    expect(counters).toEqual([null, '3 en curso', '3 próximas', '4 nuevas', '4 pendientes', null]);
    expect(navLinks()[3].querySelector('.bd')!.classList).not.toContain('soft');
    expect(navLinks()[1].querySelector('.bd')!.classList).toContain('soft');
  });

  it('la barra superior avisa los mensajes sin leer y lleva al perfil desde el avatar', () => {
    const bell = el().querySelector('.top a[appIconButton]')!;
    expect(bell.getAttribute('aria-label')).toBe('Mensajes: 2 sin leer');
    expect(bell.querySelector('.dot')).not.toBeNull();
    const avatar = el().querySelector('.top [appAvatar]')!;
    expect(avatar.textContent!.trim()).toBe('CR');
    expect(avatar.getAttribute('aria-label')).toBe('Mi perfil');
    expect(avatar.getAttribute('href')).toBe('/postulante/perfil');
  });

  it('al navegar muestra la vista con su título', async () => {
    await harness.navigateByUrl('/postulante/calendario');
    expect(el().querySelector('h1')!.textContent).toBe('Calendario');
    expect(navLinks()[2].getAttribute('aria-current')).toBe('page');
  });

  it('"Salir" cierra la sesión, vacía los datos y vuelve al acceso', async () => {
    const logout = Array.from(el().querySelectorAll('button')).find((b) => b.textContent!.includes('Salir'))!;
    logout.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(SessionService).authenticated()).toBe(false);
    expect(TestBed.inject(PostulanteStore).loaded()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/postulante/ingresar');
  });
});
