import {
  Application,
  CandidateProfile,
  EMAIL_PATTERN,
  Interview,
  JobOpening,
  applicationStatusTone,
  firstName,
  initials,
  interviewerShortName,
  isInterviewHandoff,
  isMeetingRoomOpen,
  isMissingRequired,
  isUpcoming,
  profileCompleteness,
  stepState,
  toOffer,
} from '.';

const app = (over: Partial<Application> = {}): Application => ({
  id: 'p1',
  jobId: 1,
  ref: 'IND3307418',
  title: 'Operario/a',
  zone: 'Monte Grande',
  area: 'Industria',
  stage: 3,
  match: 92,
  status: 'Entrevista confirmada',
  appliedAt: new Date(2026, 10, 1),
  history: [],
  nextStep: '',
  ...over,
});

const interview = (over: Partial<Interview> = {}): Interview => ({
  id: 'e1',
  type: 'recruiter',
  applicationId: 'p1',
  title: 'Entrevista con la selectora',
  with: 'Mariana Sosa',
  startsAt: new Date(2026, 10, 6, 10, 0),
  durationMin: 30,
  status: 'confirmed',
  ...over,
});

describe('application.model', () => {
  it('marca en alerta los estados que piden una acción', () => {
    expect(applicationStatusTone(app({ status: 'Confirmá tu entrevista' }))).toBe('warn');
    expect(applicationStatusTone(app({ status: 'Falta tu entrevista con el agente' }))).toBe('warn');
    expect(applicationStatusTone(app())).toBe('ok');
    expect(applicationStatusTone(app({ outcome: 'rejected' }))).toBe('');
  });

  it('calcula el estado de cada paso del stepper', () => {
    const current = app({ stage: 3 });
    expect([0, 1, 2, 3].map((i) => stepState(current, i))).toEqual(['done', 'done', 'now', 'pend']);
    expect(stepState(app({ stage: 4, outcome: 'rejected' }), 3)).toBe('bad');
    expect(stepState(app({ stage: 4 }), 3)).toBe('done');
  });
});

describe('interview.model', () => {
  const start = new Date(2026, 10, 6, 10, 0).getTime();

  it('considera próxima una entrevista hasta que termina', () => {
    expect(isUpcoming(interview(), start + 29 * 60_000)).toBe(true);
    expect(isUpcoming(interview(), start + 31 * 60_000)).toBe(false);
    expect(isUpcoming(interview({ status: 'done' }), start - 60_000)).toBe(false);
  });

  it('abre la sala de Teams 15 minutos antes', () => {
    expect(isMeetingRoomOpen(interview(), start - 16 * 60_000)).toBe(false);
    expect(isMeetingRoomOpen(interview(), start - 15 * 60_000)).toBe(true);
    expect(isMeetingRoomOpen(interview(), start + 30 * 60_000)).toBe(true);
  });

  it('usa un nombre corto para las frases', () => {
    expect(interviewerShortName(interview())).toBe('Mariana');
    expect(interviewerShortName(interview({ with: 'Selectora de Grupo Gestión' }))).toBe('la selectora');
  });
});

describe('job.model', () => {
  it('convierte una búsqueda en oferta con turno y dos beneficios como etiquetas', () => {
    const job: JobOpening = {
      id: 3,
      title: 'Maquinista',
      zone: 'Monte Grande',
      area: 'Logística',
      ref: 'LOG8803174',
      shift: 'Rotativo · 3 turnos',
      minutes: 18,
      benefits: ['Plus por turno noche', 'Obra social', 'Otro'],
      match: 81,
      reason: 'Cerca de tu zona.',
    };
    expect(toOffer(job)).toEqual(
      expect.objectContaining({ id: '3', jobId: 3, tags: ['Rotativo · 3 turnos', 'Plus por turno noche', 'Obra social'] }),
    );
  });
});

describe('profile.model', () => {
  const profile: CandidateProfile = {
    name: 'Camila Rojas',
    phone: '11 5550-0142',
    location: 'Monte Grande',
    education: '',
    availability: ['Mañana'],
    mobility: ['Transporte público'],
    experience: '  ',
    cvFileName: 'CV.pdf',
    sizes: { pants: '', shirt: '', shoes: '' },
  };

  it('calcula el porcentaje de perfil completo como la maqueta (7 de 9)', () => {
    expect(profileCompleteness(profile, 'camila@ejemplo.com')).toBe(78);
    expect(profileCompleteness({ ...profile, education: 'Secundario completo', experience: 'Depósito' }, 'c@e.com')).toBe(100);
  });

  it('obtiene iniciales y nombre de pila', () => {
    expect(initials('Camila Rojas')).toBe('CR');
    expect(initials('Ana María Pérez')).toBe('AM');
    expect(firstName('Camila Rojas')).toBe('Camila');
  });
});

describe('document y handoff', () => {
  it('detecta documentos obligatorios faltantes', () => {
    const doc = { id: 'd3', kind: 'cuil', name: 'CUIL', required: true, fileName: null } as const;
    expect(isMissingRequired(doc)).toBe(true);
    expect(isMissingRequired({ ...doc, fileName: 'cuil.pdf' })).toBe(false);
    expect(isMissingRequired({ ...doc, required: false })).toBe(false);
  });

  it('valida correos y datos de la portada', () => {
    expect(EMAIL_PATTERN.test('nombre@correo.com')).toBe(true);
    expect(EMAIL_PATTERN.test('nombre@correo')).toBe(false);
    expect(isInterviewHandoff({ v: 1, job: 2, match: 88, meeting: 0, at: 0 })).toBe(true);
    expect(isInterviewHandoff({ v: 2, job: 2, match: 88 })).toBe(false);
    expect(isInterviewHandoff(null)).toBe(false);
  });
});
