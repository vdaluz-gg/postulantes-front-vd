import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDatabase } from '../../../../core/data-access/mock/mock-postulante.apis';
import { provideDataAccess } from '../../../../core/data-access/provide-data-access';
import { CandidateDocument, Interview } from '../../../../core/models';
import { MotionService } from '../../../../core/services/motion.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SessionService } from '../../../../core/services/session.service';
import { POSTULANTE_ROUTES } from '../../postulante.routes';
import { PostulanteStore } from '../../state/postulante.store';
import { buildLead } from './home.view-model';

/** Martes 3 de noviembre de 2026, el día de las capturas de referencia. */
const NOW = new Date(2026, 10, 3, 12, 0);

describe('buildLead', () => {
  const recruiter = { type: 'recruiter', with: 'Mariana Sosa', startsAt: new Date(2026, 10, 6, 10) } as Interview;
  const doc = { required: true, fileName: null } as CandidateDocument;

  it('resume la próxima entrevista y los documentos con los datos en negrita', () => {
    const lead = buildLead(recruiter, [doc, doc], NOW.getTime());
    expect(lead.map((p) => p.text).join('')).toBe(
      'En 3 días a las 10:00 h tenés tu entrevista con Mariana por Teams. Te faltan 2 documentos para que avancen tus postulaciones.',
    );
    expect(lead.filter((p) => p.strong).map((p) => p.text)).toEqual(['10:00 h', 'Mariana', '2 documentos']);
  });

  it('usa singular con un solo documento y avisa cuando todo está en orden', () => {
    expect(buildLead(null, [doc], NOW.getTime()).map((p) => p.text).join('')).toBe(
      'Te falta 1 documento para que avance tus postulaciones.',
    );
    expect(buildLead(null, [], NOW.getTime())[0].text).toBe('Todo en orden. Te avisamos apenas haya novedades.');
  });
});

describe('HomePage', () => {
  let harness: RouterTestingHarness;
  let body: HTMLElement;

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['requestAnimationFrame', 'queueMicrotask', 'nextTick', 'setImmediate'] });
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideDataAccess(),
        provideRouter([{ path: 'postulante', children: POSTULANTE_ROUTES }], withComponentInputBinding()),
        { provide: MotionService, useValue: { reduced: () => false } },
      ],
    });
    TestBed.inject(MockDatabase).reset(NOW);
    TestBed.inject(SessionService).start('camila.rojas@ejemplo.com');
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/postulante/inicio');
    body = document.body;
  });

  afterEach(() => jest.useRealTimers());

  const todos = () => Array.from(body.querySelectorAll<HTMLElement>('[appTodo]'));
  const todoTitles = () => todos().map((t) => t.querySelector('b')!.textContent);

  it('saluda con la fecha y el resumen del día', () => {
    expect(body.querySelector('.eyebrow')!.textContent).toBe('Martes, 3 de noviembre');
    expect(body.querySelector('h1')!.textContent).toBe('Hola, Camila.');
    expect(body.querySelector('.lead')!.textContent!.replace(/\s+/g, ' ').trim()).toContain(
      'En 3 días a las 10:00 h tenés tu entrevista con Mariana por Teams.',
    );
  });

  it('muestra la próxima reunión con la selectora', () => {
    const next = body.querySelector('[appNextInterview]')!;
    expect(next.querySelector('.when b')!.textContent).toBe('10:00');
    expect(next.querySelector('h3')!.textContent).toBe(
      'Entrevista con la selectora · Operario/a de producción · Feteados',
    );
    expect(next.querySelector('p')!.textContent).toBe('Mariana Sosa · en 3 días · 30 min');
  });

  it('lista los cuatro pendientes de la referencia', () => {
    expect(todoTitles()).toEqual([
      'Confirmá tu reunión del martes 11:00 h',
      'Subí 2 documentos que piden tus postulaciones',
      'Hacé tu entrevista con el agente de IA',
      'Completá tu perfil (78 %)',
    ]);
  });

  it('confirmar tacha la fila, la confirma a los 1200 ms y avisa en la isla', async () => {
    todos()[0].querySelector('button')!.click();
    harness.detectChanges();
    expect(todos()[0].classList).toContain('done');

    jest.advanceTimersByTime(1200);
    await harness.fixture.whenStable();
    expect(TestBed.inject(PostulanteStore).pendingInterview()).toBeNull();
    expect(TestBed.inject(NotificationService).current()!.message).toBe(
      'Confirmaste tu reunión del martes a las 11:00 h.',
    );
    expect(todoTitles()).not.toContain('Confirmá tu reunión del martes 11:00 h');
  });

  it('"Subir" lleva a la pestaña de documentos', async () => {
    todos()[1].querySelector('button')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/postulante/mensajes?tab=documentos');
  });

  it('muestra hasta tres próximas reuniones con su estado', () => {
    const rows = Array.from(body.querySelectorAll('[appInterviewRow]'));
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.querySelector('[appChip]')!.textContent!.trim())).toEqual([
      'Confirmada',
      'Confirmada',
      'Falta confirmar',
    ]);
  });

  it('muestra las postulaciones en curso con su stepper', () => {
    const tiles = Array.from(body.querySelectorAll('[appApplicationTile]'));
    expect(tiles).toHaveLength(3);
    expect(tiles[0].getAttribute('aria-label')).toBe(
      'Ver seguimiento de Operario/a de producción · Feteados. Entrevista confirmada',
    );
    expect(tiles[0].querySelectorAll('.st')).toHaveLength(4);
  });

  it('"Unirme a Teams" antes de hora avisa cuándo abre la sala y ofrece agendarla', () => {
    const join = Array.from(body.querySelectorAll('button')).find((b) => b.textContent!.includes('Unirme a Teams'))!;
    join.click();
    const notice = TestBed.inject(NotificationService).current()!;
    expect(notice.message).toBe('La sala se abre 15 minutos antes (viernes 09:45 h). Te avisamos por correo y WhatsApp.');
    expect(notice.action!.label).toBe('Agregar al calendario');
  });
});
