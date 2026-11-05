import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { MotionService } from '../../core/services/motion.service';
import { BACKOFFICE_ROUTES } from './backoffice.routes';
import { AuthApi, DEMO_USERS } from './data/auth.api';
import { SiteConfigApi } from './data/site-config.api';
import { SITE_CONFIG_SEED } from './data/site-config.seed';

const admin = (({ password: _, ...rest }) => rest)(DEMO_USERS[0]);

describe('Backoffice', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let logins: string[];

  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    harness.detectChanges();
  };
  const buttonByText = (text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent!.trim() === text)!;
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    sessionStorage.clear();
    logins = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'backoffice', children: BACKOFFICE_ROUTES }], withComponentInputBinding()),
        provideHttpClient(),
        { provide: MotionService, useValue: { reduced: () => true } },
        {
          provide: AuthApi,
          useValue: {
            login: (email: string, password: string) => {
              logins.push(email);
              return password === DEMO_USERS[0].password
                ? of({ accessToken: 'mock.test', admin })
                : throwError(() => ({ statusCode: 401, error: 'Unauthorized', message: 'Credenciales inválidas' }));
            },
          },
        },
        {
          provide: SiteConfigApi,
          useValue: {
            load: () => of(SITE_CONFIG_SEED),
            save: (config: typeof SITE_CONFIG_SEED) => of({ ...config, status: 'draft', version: 2 }),
            publish: (config: typeof SITE_CONFIG_SEED) => of({ ...config, status: 'published', version: 2 }),
          },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
    el = harness.fixture.nativeElement;
  });

  it('sin sesión lleva al ingreso y valida antes de enviar', async () => {
    await harness.navigateByUrl('/backoffice');
    await settle();
    expect(TestBed.inject(Router).url).toBe('/backoffice/ingresar?volver=%2Fbackoffice');
    expect(el.querySelector('h1')!.textContent).toBe('Ingresá como administrador');

    buttonByText('Ingresar').click();
    await settle();
    const errors = Array.from(el.querySelectorAll('.err')).map((p) => p.textContent);
    expect(errors).toEqual(['Escribí tu correo.', 'Escribí tu contraseña.']);
    expect(logins).toEqual([]);
  });

  it('con datos incorrectos avisa sin decir cuál falló', async () => {
    await harness.navigateByUrl('/backoffice/ingresar');
    await settle();
    const [email, password] = Array.from(el.querySelectorAll<HTMLInputElement>('bo-text-field input'));
    type(email, 'marketing@ejemplo.com');
    type(password, 'Incorrecta123');
    buttonByText('Ingresar').click();
    await settle();
    expect(el.querySelector('.form-err')!.textContent).toBe('El correo o la contraseña no coinciden. Revisalos y probá de nuevo.');
  });

  it('con los datos de ejemplo entra al editor y edita un campo desde el panel', async () => {
    await harness.navigateByUrl('/backoffice/ingresar');
    await settle();
    buttonByText('Entrar con datos de ejemplo').click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/backoffice');
    expect(el.querySelector('app-editor-toolbar')).not.toBeNull();

    const layer = Array.from(el.querySelectorAll<HTMLButtonElement>('app-layers-panel .layer')).find((b) => b.textContent!.includes('DNI'))!;
    layer.click();
    await settle();
    expect(el.querySelector('app-inspector-head h2')!.textContent).toBe('DNI');
    expect(layer.getAttribute('aria-current')).toBe('true');

    type(el.querySelector<HTMLInputElement>('app-field-inspector bo-text-field input')!, 'Documento');
    await settle();
    const labels = Array.from(el.querySelectorAll('app-canvas-preview .field')).map((b) => b.getAttribute('aria-label'));
    expect(labels).toContain('Campo: Documento');
    expect(el.querySelector('app-editor-toolbar .state')!.textContent).toContain('Cambios sin guardar');
  });

  it('borrar un campo se puede deshacer desde el aviso', async () => {
    sessionStorage.setItem('gg_bo_ses', JSON.stringify({ accessToken: 'mock.test', admin }));
    await harness.navigateByUrl('/backoffice');
    await settle();
    Array.from(el.querySelectorAll<HTMLButtonElement>('app-canvas-preview .field'))
      .find((b) => b.getAttribute('aria-label') === 'Campo: Zona donde vivís')!
      .click();
    await settle();
    el.querySelector<HTMLButtonElement>('app-field-inspector button[aria-label="Borrar el campo"]')!.click();
    await settle();
    const count = () => Array.from(el.querySelectorAll('app-canvas-preview .field')).filter((b) => b.getAttribute('aria-label') === 'Campo: Zona donde vivís').length;
    expect(count()).toBe(0);
    expect(el.querySelector('bo-island .tx')!.textContent).toBe('Borraste «Zona donde vivís».');

    buttonByText('Deshacer').click();
    await settle();
    expect(count()).toBe(1);
  });
});
