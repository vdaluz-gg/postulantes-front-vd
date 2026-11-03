import { TestBed } from '@angular/core/testing';
import { provideDataAccess } from '../../../core/data-access/provide-data-access';
import { MockDatabase } from '../../../core/data-access/mock/mock-postulante.apis';
import { SessionService } from '../../../core/services/session.service';
import { PostulanteStore } from './postulante.store';

/** Martes 3 de noviembre de 2026, 12:00: el mismo día de las capturas de referencia. */
const NOW = new Date(2026, 10, 3, 12, 0);

describe('PostulanteStore', () => {
  let store: PostulanteStore;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideDataAccess()] });
    TestBed.inject(MockDatabase).reset(NOW);
    TestBed.inject(SessionService).start('camila.rojas@ejemplo.com');
    store = TestBed.inject(PostulanteStore);
    store.load();
  });

  afterEach(() => jest.useRealTimers());

  it('carga los datos del postulante', () => {
    expect(store.loaded()).toBe(true);
    expect(store.firstName()).toBe('Camila');
    expect(store.initials()).toBe('CR');
  });

  it('calcula los contadores del menú como la maqueta', () => {
    expect(store.activeApplications()).toHaveLength(3);
    expect(store.upcomingInterviews()).toHaveLength(3);
    expect(store.offers()).toHaveLength(4);
    expect(store.unreadCount() + store.missingDocuments().length).toBe(4);
  });

  it('elige como próxima la reunión con una persona', () => {
    const next = store.nextInterview()!;
    expect(next.type).toBe('recruiter');
    expect(next.with).toBe('Mariana Sosa');
    expect(next.startsAt.getDay()).toBe(5);
  });

  it('ofrece solo búsquedas no postuladas con match suficiente', () => {
    const applied = new Set(store.applications().map((a) => a.jobId));
    expect(store.offers().every((o) => !applied.has(o.jobId) && o.match >= 50)).toBe(true);
  });

  it('calcula el perfil completo al 78 %', () => {
    expect(store.completeness()).toBe(78);
  });

  it('confirmar una reunión actualiza la entrevista y el historial de la postulación', () => {
    const pending = store.pendingInterview()!;
    store.confirmInterview(pending.id);
    expect(store.pendingInterview()).toBeNull();
    const app = store.application(pending.applicationId)!;
    expect(app.status).toBe('Entrevista confirmada');
    expect(app.history.at(-1)!.text).toBe('Confirmaste la reunión.');
  });

  it('la hora avanza y las reuniones pasadas dejan de ser próximas', () => {
    const first = store.upcomingInterviews()[0];
    jest.setSystemTime(first.startsAt.getTime() + first.durationMin * 60_000 + 1);
    jest.advanceTimersByTime(30_000);
    expect(store.upcomingInterviews().some((i) => i.id === first.id)).toBe(false);
  });

  it('no vuelve a pedir los datos si ya están cargados', () => {
    const before = store.applications();
    store.load();
    expect(store.applications()).toBe(before);
  });
});
