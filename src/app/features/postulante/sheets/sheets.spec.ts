import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDatabase } from '../../../core/data-access/mock/mock-postulante.apis';
import { provideDataAccess } from '../../../core/data-access/provide-data-access';
import { MotionService } from '../../../core/services/motion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionService } from '../../../core/services/session.service';
import { SheetService } from '../../../core/services/sheet.service';
import { POSTULANTE_ROUTES } from '../postulante.routes';
import { PostulanteStore } from '../state/postulante.store';

const NOW = new Date(2026, 10, 3, 12, 0);

describe('Hojas del portal', () => {
  let harness: RouterTestingHarness;
  const body = () => document.body;
  const dialog = () => body().querySelector<HTMLElement>('[role="dialog"]');
  const button = (text: string, root: ParentNode = body()) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent!.trim().includes(text))!;
  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
    await new Promise((r) => setTimeout(r));
  };

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideDataAccess(),
        provideRouter([{ path: 'postulante', children: POSTULANTE_ROUTES }], withComponentInputBinding()),
        { provide: MotionService, useValue: { reduced: () => true } },
      ],
    });
    jest.useFakeTimers({ now: NOW, doNotFake: ['requestAnimationFrame', 'queueMicrotask', 'nextTick', 'setImmediate', 'setTimeout'] });
    TestBed.inject(MockDatabase).reset(NOW);
    TestBed.inject(SessionService).start('camila.rojas@ejemplo.com');
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/postulante/inicio');
  });

  afterEach(() => {
    TestBed.inject(SheetService).close();
    jest.useRealTimers();
  });

  it('"Ver detalle" abre el detalle de la reunión como diálogo modal con foco adentro', async () => {
    const trigger = button('Ver detalle');
    trigger.focus();
    trigger.click();
    await settle();

    const sheet = dialog()!;
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    expect(body().querySelector(`#${sheet.getAttribute('aria-labelledby')}`)!.textContent).toBe(
      'Entrevista con la selectora',
    );
    expect(sheet.contains(document.activeElement)).toBe(true);
    const terms = Array.from(sheet.querySelectorAll('dt')).map((d) => d.textContent);
    expect(terms).toEqual(['Cuándo', 'Duración', 'Con', 'Postulación', 'Dónde']);
    expect(sheet.querySelector('dd')!.textContent).toContain('Viernes, 6 de noviembre, 10:00 h');
    expect(button('Unirme a Teams', sheet)).toBeDefined();
  });

  it('Escape cierra la hoja y devuelve el foco a quien la abrió', async () => {
    const trigger = button('Ver detalle');
    trigger.focus();
    trigger.click();
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('una fila de reunión pendiente se confirma desde el detalle', async () => {
    const pendingRow = Array.from(body().querySelectorAll<HTMLButtonElement>('[appInterviewRow]')).find((r) =>
      r.textContent!.includes('Falta confirmar'),
    )!;
    pendingRow.click();
    await settle();
    button('Confirmar', dialog()!).click();
    await settle();
    expect(dialog()).toBeNull();
    expect(TestBed.inject(PostulanteStore).pendingInterview()).toBeNull();
    expect(TestBed.inject(NotificationService).current()!.message).toContain('Confirmaste tu reunión del martes');
  });

  it('"Pedir otro horario" reemplaza la hoja sin repetir la animación y envía el pedido', async () => {
    button('Ver detalle').click();
    await settle();
    button('Pedir otro horario', dialog()!).click();
    await settle();

    expect(body().querySelector('.sb')!.classList).toContain('re');
    const radios = Array.from(dialog()!.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios).toHaveLength(3);
    expect(radios[0].checked).toBe(true);
    radios[1].click();
    await settle();

    button('Enviar pedido', dialog()!).click();
    await settle();
    expect(dialog()).toBeNull();
    const interview = TestBed.inject(PostulanteStore).interview('e1')!;
    expect(interview.status).toBe('reschedule-requested');
    expect(interview.rescheduleRequestedFor!.getHours()).toBe(15);
    expect(TestBed.inject(NotificationService).current()!.message).toBe(
      'Pedido enviado a Mariana. Te respondemos por correo.',
    );
  });

  it('el fondo cierra la hoja y un click dentro no', async () => {
    button('Ver detalle').click();
    await settle();
    dialog()!.click();
    await settle();
    expect(dialog()).not.toBeNull();
    body().querySelector<HTMLElement>('.sb')!.click();
    await settle();
    expect(dialog()).toBeNull();
  });

  it('en "Mi perfil" está "Salir" para celular, y cierra la sesión', async () => {
    await harness.navigateByUrl('/postulante/perfil');
    const session = body().querySelector('.session')!;
    expect(session.querySelector('a')!.getAttribute('href')).toBe('/');
    button('Salir', session).click();
    await settle();
    expect(TestBed.inject(SessionService).authenticated()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/postulante/ingresar');
  });
});
