import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthApi } from '../../../../core/data-access/auth.api';
import { MockAuthApi } from '../../../../core/data-access/mock/mock-auth.api';
import { SessionService } from '../../../../core/services/session.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let el: HTMLElement;
  let navigate: jest.SpyInstance;

  const field = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`);
  const type = (id: string, value: string) => {
    const input = field(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };
  const buttonByText = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.trim().startsWith(text))!;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthApi, useClass: MockAuthApi }],
    }).compileComponents();
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('arranca pidiendo el correo, con foco en el campo', () => {
    expect(el.querySelector('h1')!.textContent).toContain('Ingresá a tu portal');
    expect(document.activeElement).toBe(field('lg-mail'));
    expect(field('lg-code')).toBeNull();
    expect(buttonByText('Usar otro correo')).toBeUndefined();
  });

  it('avisa si el correo no es válido', async () => {
    type('lg-mail', 'camila@correo');
    await submit();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Revisá el correo');
    expect(field('lg-code')).toBeNull();
  });

  it('pasa al código, rechaza uno equivocado y entra con el correcto', async () => {
    type('lg-mail', 'camila@ejemplo.com');
    await submit();
    expect(el.querySelector('.sub')!.textContent).toContain('Te enviamos un código a camila@ejemplo.com');
    const code = el.querySelector('#lg-hint b')!.textContent!.trim();
    expect(code).toMatch(/^\d{6}$/);

    type('lg-code', '12');
    await submit();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('El código tiene 6 dígitos.');

    const wrong = code === '111111' ? '222222' : '111111';
    type('lg-code', wrong);
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Ese código no es el que te enviamos');
    expect(navigate).not.toHaveBeenCalled();

    type('lg-code', code);
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/postulante/inicio']);
    expect(TestBed.inject(SessionService).email()).toBe('camila@ejemplo.com');
  });

  it('"Completar" carga el código del prototipo y entra', async () => {
    type('lg-mail', 'camila@ejemplo.com');
    await submit();
    buttonByText('Completar').click();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/postulante/inicio']);
  });

  it('"Usar otro correo" vuelve al paso del correo', async () => {
    type('lg-mail', 'camila@ejemplo.com');
    await submit();
    buttonByText('Usar otro correo').click();
    await fixture.whenStable();
    expect(field('lg-mail')!.value).toBe('camila@ejemplo.com');
    expect(field('lg-code')).toBeNull();
  });

  it('entra con datos de ejemplo', async () => {
    buttonByText('Entrar con datos de ejemplo').click();
    await fixture.whenStable();
    expect(TestBed.inject(SessionService).authenticated()).toBe(true);
    expect(TestBed.inject(SessionService).email()).toBe('camila.rojas@ejemplo.com');
    expect(navigate).toHaveBeenCalledWith(['/postulante/inicio']);
  });
});
