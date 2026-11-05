import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { API_BASE_URL, API_TOKEN, authInterceptor, errorMessage } from '../../../core/api/api';
import { STORAGE_KEYS } from '../../../core/services/storage.service';
import { AuthApi, DEMO_USERS, MockAuthApi } from './auth.api';
import { AuthStore } from './auth.store';
import { EditorStore } from './editor.store';
import { MockSiteConfigApi, SiteConfigApi } from './site-config.api';
import { SiteConfig } from './site-config.model';
import { addField, findField, updateField } from './site-config.ops';
import { SITE_CONFIG_SEED } from './site-config.seed';

describe('login simulado', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: new MockAuthApi() }] });
  });
  afterEach(() => jest.useRealTimers());

  it('ingresa con un usuario de prueba y guarda la sesión en la pestaña', async () => {
    const auth = TestBed.inject(AuthStore);
    const user = DEMO_USERS[0];
    const done = firstValueFrom(auth.login(` ${user.email.toUpperCase()} `, user.password));
    jest.advanceTimersByTime(600);
    const response = await done;
    expect(response.admin).toEqual({ id: user.id, email: user.email, fullName: user.fullName, role: 'marketing' });
    expect(JSON.stringify(response)).not.toContain(user.password);
    expect(auth.loggedIn()).toBe(true);
    expect(sessionStorage.getItem(STORAGE_KEYS.backofficeSession)).toContain(response.accessToken);

    auth.logout();
    expect(auth.loggedIn()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEYS.backofficeSession)).toBeNull();
  });

  it('con datos incorrectos responde como el backend, sin decir qué falló', async () => {
    const failed = firstValueFrom(TestBed.inject(AuthStore).login(DEMO_USERS[0].email, 'otra'));
    jest.advanceTimersByTime(600);
    await expect(failed).rejects.toEqual(expect.objectContaining({ statusCode: 401, message: 'Credenciales inválidas' }));
  });
});

describe('API', () => {
  it('extrae el mensaje del formato de error del backend', () => {
    expect(errorMessage({ statusCode: 400, error: 'Bad Request', message: ['El correo no es válido', 'otro'] })).toBe('El correo no es válido');
    expect(errorMessage({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido o vencido' })).toBe('Token inválido o vencido');
    expect(errorMessage(null)).toBe('No pudimos completar la acción. Probá de nuevo.');
  });

  it('el interceptor manda el token solo a la API', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: API_TOKEN, useValue: () => 'abc' },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    http.get('http://api/backoffice/site-config').subscribe();
    http.get('mock/ofertas.json').subscribe();
    expect(ctrl.expectOne('http://api/backoffice/site-config').request.headers.get('Authorization')).toBe('Bearer abc');
    expect(ctrl.expectOne('mock/ofertas.json').request.headers.has('Authorization')).toBe(false);
  });
});

describe('configuración simulada', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  const run = async <T>(obs: import('rxjs').Observable<T>) => {
    const p = firstValueFrom(obs);
    jest.advanceTimersByTime(400);
    return p;
  };

  it('arranca con la configuración inicial, guarda borradores y publica', async () => {
    const api = TestBed.runInInjectionContext(() => new MockSiteConfigApi());
    expect(await run(api.load())).toBe(SITE_CONFIG_SEED);

    const edited = updateField(SITE_CONFIG_SEED, 'postulantes', 'application', 'dni', { label: 'Documento' });
    const draft = await run(api.save(edited, 'Equipo de Marketing'));
    expect(draft).toEqual(expect.objectContaining({ status: 'draft', version: 2, updatedBy: 'Equipo de Marketing' }));
    expect(findField(await run(api.load()), 'postulantes', 'application', 'dni')!.label).toBe('Documento');

    const published = await run(api.publish(draft, 'Administración'));
    expect(published).toEqual(expect.objectContaining({ status: 'published', version: 3 }));
  });
});

describe('EditorStore', () => {
  let saved: SiteConfig[];

  beforeEach(() => {
    saved = [];
    const api: Partial<SiteConfigApi> = {
      load: () => of(SITE_CONFIG_SEED),
      save: (config, author) => {
        const stored = { ...config, status: 'draft' as const, version: config.version + 1, updatedBy: author };
        saved.push(stored);
        return of(stored);
      },
      publish: (config) => of({ ...config, status: 'published' as const }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: SiteConfigApi, useValue: api }] });
  });

  const loaded = () => {
    const store = TestBed.inject(EditorStore);
    store.load();
    return store;
  };

  it('carga, aplica cambios, deshace y rehace', () => {
    const store = loaded();
    expect(store.status()).toBe('ready');
    expect(store.dirty()).toBe(false);

    store.apply(updateField(store.config()!, 'postulantes', 'application', 'dni', { label: 'Documento' }));
    expect(store.dirty()).toBe(true);
    store.undo();
    expect(findField(store.config()!, 'postulantes', 'application', 'dni')!.label).toBe('DNI');
    expect(store.dirty()).toBe(false);
    store.redo();
    expect(findField(store.config()!, 'postulantes', 'application', 'dni')!.label).toBe('Documento');
  });

  it('junta en un paso lo que se tipea sobre el mismo dato', () => {
    const store = loaded();
    for (const label of ['D', 'Do', 'Doc']) {
      store.apply(updateField(store.config()!, 'postulantes', 'application', 'dni', { label }), { key: 'dni.label' });
    }
    store.undo();
    expect(store.canUndo()).toBe(false);
    expect(findField(store.config()!, 'postulantes', 'application', 'dni')!.label).toBe('DNI');
  });

  it('selecciona lo que se crea y suelta la selección si se deshace', () => {
    const store = loaded();
    store.apply(addField(store.config()!, 'postulantes', 'application'), {
      select: (id) => ({ kind: 'field', audience: 'postulantes', sectionId: 'application', id }),
    });
    expect(store.selection()).toEqual({ kind: 'field', audience: 'postulantes', sectionId: 'application', id: 'campo' });
    store.undo();
    expect(store.selection()).toBeNull();
  });

  it('guarda con el nombre de quien edita y no publica si hay problemas', () => {
    const store = loaded();
    store.apply(updateField(store.config()!, 'postulantes', 'application', 'zone', { label: '' }));
    store.save();
    expect(saved[0].updatedBy).toBe('Backoffice');
    expect(store.dirty()).toBe(false);
    expect(store.publish()).toBe(false);
    expect(store.issues()).toHaveLength(1);
  });
});
