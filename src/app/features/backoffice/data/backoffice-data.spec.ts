import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  API_BASE_URL,
  API_TOKEN,
  API_UNAUTHORIZED,
  authInterceptor,
  errorMessage,
} from '../../../core/api/api';
import { STORAGE_KEYS } from '../../../core/services/storage.service';
import { AuthApi, DEMO_USERS, HttpAuthApi, MockAuthApi } from './auth.api';
import { AuthStore } from './auth.store';
import { EditorStore } from './editor.store';
import { HttpSiteConfigApi, MockSiteConfigApi, SiteConfigApi } from './site-config.api';
import { SiteConfig } from './site-config.model';
import { addField, findField, updateField } from './site-config.ops';
import { SITE_CONFIG_SEED } from './site-config.seed';

describe('login simulado', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: new MockAuthApi() }],
    });
  });
  afterEach(() => jest.useRealTimers());

  it('ingresa con un usuario de prueba y guarda la sesión en la pestaña', async () => {
    const auth = TestBed.inject(AuthStore);
    const user = DEMO_USERS[0];
    const done = firstValueFrom(auth.login(` ${user.email.toUpperCase()} `, user.password));
    jest.advanceTimersByTime(600);
    const response = await done;
    expect(response.admin).toEqual({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: 'marketing',
    });
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
    await expect(failed).rejects.toEqual(
      expect.objectContaining({ statusCode: 401, message: 'Credenciales inválidas' }),
    );
  });

  it('el mock también confirma el token, y rechaza uno desconocido', async () => {
    const api = new MockAuthApi();
    expect((await firstValueFrom(api.me(`mock.${DEMO_USERS[1].id}`))).email).toBe(
      DEMO_USERS[1].email,
    );
    await expect(firstValueFrom(api.me('otro'))).rejects.toEqual(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});

describe('API', () => {
  it('extrae el mensaje del formato de error del backend', () => {
    expect(
      errorMessage({
        statusCode: 400,
        error: 'Bad Request',
        message: ['El correo no es válido', 'otro'],
      }),
    ).toBe('El correo no es válido');
    expect(
      errorMessage({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido o vencido' }),
    ).toBe('Token inválido o vencido');
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
    expect(
      ctrl.expectOne('http://api/backoffice/site-config').request.headers.get('Authorization'),
    ).toBe('Bearer abc');
    expect(ctrl.expectOne('mock/ofertas.json').request.headers.has('Authorization')).toBe(false);
  });

  it('si la API rechaza el token (401), avisa a la sesión; otros errores no', () => {
    const unauthorized = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: API_TOKEN, useValue: () => 'abc' },
        { provide: API_UNAUTHORIZED, useValue: unauthorized },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    http.get('http://api/a').subscribe({ error: () => undefined });
    ctrl.expectOne('http://api/a').flush('x', { status: 500, statusText: 'Error' });
    expect(unauthorized).not.toHaveBeenCalled();
    http.get('http://api/b').subscribe({ error: () => undefined });
    ctrl.expectOne('http://api/b').flush('x', { status: 401, statusText: 'Unauthorized' });
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });

  it('demasiados intentos (429) se explica en castellano', () => {
    const error = new HttpErrorResponse({
      status: 429,
      error: { statusCode: 429, message: 'ThrottlerException: Too Many Requests' },
    });
    expect(errorMessage(error)).toBe(
      'Hiciste muchos intentos seguidos. Esperá un minuto y probá de nuevo.',
    );
  });
});

describe('HttpAuthApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: AuthApi, useClass: HttpAuthApi },
      ],
    }),
  );

  it('ingresa con POST /auth/login y confirma el token con GET /auth/me', async () => {
    const api = TestBed.inject(AuthApi);
    const ctrl = TestBed.inject(HttpTestingController);
    const profile = {
      id: 'a1',
      email: 'admin@ejemplo.com',
      fullName: 'Administración',
      role: 'admin' as const,
    };

    const login = firstValueFrom(api.login('admin@ejemplo.com', 'Backoffice2026'));
    const req = ctrl.expectOne('http://api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@ejemplo.com', password: 'Backoffice2026' });
    req.flush({ accessToken: 'jwt', admin: profile });
    expect(await login).toEqual({ accessToken: 'jwt', admin: profile });

    const me = firstValueFrom(api.me('jwt'));
    const meReq = ctrl.expectOne('http://api/auth/me');
    expect(meReq.request.headers.get('Authorization')).toBe('Bearer jwt');
    meReq.flush(profile);
    expect(await me).toEqual(profile);
    ctrl.verify();
  });
});

describe('HttpSiteConfigApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: SiteConfigApi, useClass: HttpSiteConfigApi },
      ],
    }),
  );

  it('sin nada guardado en el servidor (404) arranca de la configuración inicial', async () => {
    const api = TestBed.inject(SiteConfigApi);
    const ctrl = TestBed.inject(HttpTestingController);
    const loaded = firstValueFrom(api.load());
    ctrl
      .expectOne('http://api/backoffice/site-config')
      .flush({ message: 'x' }, { status: 404, statusText: 'Not Found' });
    expect(await loaded).toBe(SITE_CONFIG_SEED);
  });

  it('guarda con PUT y publica con POST; otros errores siguen de largo', async () => {
    const api = TestBed.inject(SiteConfigApi);
    const ctrl = TestBed.inject(HttpTestingController);
    const saved = firstValueFrom(api.save(SITE_CONFIG_SEED, 'Yo'));
    const put = ctrl.expectOne('http://api/backoffice/site-config');
    expect(put.request.method).toBe('PUT');
    put.flush({ ...SITE_CONFIG_SEED, version: 2, status: 'draft' });
    expect((await saved).version).toBe(2);

    const published = firstValueFrom(api.publish(SITE_CONFIG_SEED, 'Yo'));
    ctrl
      .expectOne('http://api/backoffice/site-config/publish')
      .flush({ ...SITE_CONFIG_SEED, version: 3 });
    expect((await published).version).toBe(3);

    const failed = firstValueFrom(api.load());
    ctrl
      .expectOne('http://api/backoffice/site-config')
      .flush({ message: 'x' }, { status: 500, statusText: 'Error' });
    await expect(failed).rejects.toBeInstanceOf(HttpErrorResponse);
    ctrl.verify();
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

    const edited = updateField(SITE_CONFIG_SEED, 'postulantes', 'application', 'dni', {
      label: 'Documento',
    });
    const draft = await run(api.save(edited, 'Equipo de Marketing'));
    expect(draft).toEqual(
      expect.objectContaining({ status: 'draft', version: 2, updatedBy: 'Equipo de Marketing' }),
    );
    expect(findField(await run(api.load()), 'postulantes', 'application', 'dni')!.label).toBe(
      'Documento',
    );

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
        const stored = {
          ...config,
          status: 'draft' as const,
          version: config.version + 1,
          updatedBy: author,
        };
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

    store.apply(
      updateField(store.config()!, 'postulantes', 'application', 'dni', { label: 'Documento' }),
    );
    expect(store.dirty()).toBe(true);
    store.undo();
    expect(findField(store.config()!, 'postulantes', 'application', 'dni')!.label).toBe('DNI');
    expect(store.dirty()).toBe(false);
    store.redo();
    expect(findField(store.config()!, 'postulantes', 'application', 'dni')!.label).toBe(
      'Documento',
    );
  });

  it('junta en un paso lo que se tipea sobre el mismo dato', () => {
    const store = loaded();
    for (const label of ['D', 'Do', 'Doc']) {
      store.apply(updateField(store.config()!, 'postulantes', 'application', 'dni', { label }), {
        key: 'dni.label',
      });
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
    expect(store.selection()).toEqual({
      kind: 'field',
      audience: 'postulantes',
      sectionId: 'application',
      id: 'campo',
    });
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
