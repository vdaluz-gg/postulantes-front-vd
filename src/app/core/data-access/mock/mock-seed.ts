import {
  Application,
  ApplicationHistoryEntry,
  CandidateDocument,
  CandidateProfile,
  InboxMessage,
  Interview,
  JobOpening,
} from '../../models';

/** Datos de ejemplo de la maqueta. Las fechas se calculan relativas al momento de carga. */
export interface MockSeed {
  readonly profile: CandidateProfile;
  readonly jobs: JobOpening[];
  readonly applications: Application[];
  readonly interviews: Interview[];
  readonly documents: CandidateDocument[];
  readonly messages: InboxMessage[];
}

export function createSeed(now: Date = new Date()): MockSeed {
  /** Fecha a d días de hoy, a la hora h:m. */
  const at = (d: number, h: number, m = 0) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    x.setHours(h, m, 0, 0);
    return x;
  };
  /** Próximo día de la semana (0 domingo ... 6 sábado), nunca hoy. */
  const nextWeekday = (dow: number, h: number, m = 0) => {
    const x = new Date(now);
    x.setDate(x.getDate() + ((dow - x.getDay() + 7) % 7 || 7));
    x.setHours(h, m, 0, 0);
    return x;
  };
  const hist = (...entries: [Date, string][]): ApplicationHistoryEntry[] =>
    entries.map(([at, text]) => ({ at, text }));

  const jobs: JobOpening[] = [
    { id: 0, title: 'Chofer de camión chasis', zone: 'Moreno / Parque Avellaneda', area: 'Logística', ref: 'LOG7712093', shift: 'Lunes a viernes · 6 a 15 h', minutes: 15, benefits: ['Obra social', 'Viáticos', 'Continuidad'], match: 79, reason: 'Tu zona y tu disponibilidad coinciden con el turno de reparto.' },
    { id: 1, title: 'Operario/a de producción · Feteados', zone: 'Monte Grande', area: 'Industria', ref: 'IND3307418', shift: 'Turno tarde · 14 a 22 h', minutes: 12, benefits: ['Comedor en planta', 'Transporte desde estación'], match: 88, reason: 'Está a 12 minutos de tu zona y coincide con tu disponibilidad.' },
    { id: 2, title: 'Auditor/a de canal masivo', zone: 'Corrientes Capital', area: 'Comercial', ref: 'COM5520841', shift: 'Lunes a viernes · 9 a 17 h', minutes: 25, benefits: ['Celular corporativo', 'Viáticos'], match: 66, reason: 'Pide buena comunicación y manejo de celular, dos cosas que mostraste.' },
    { id: 3, title: 'Maquinista de apiladora y autoelevador', zone: 'Monte Grande', area: 'Logística', ref: 'LOG8803174', shift: 'Rotativo · 3 turnos', minutes: 18, benefits: ['Plus por turno noche', 'Obra social'], match: 81, reason: 'Pide experiencia en depósito y está cerca de tu zona.' },
    { id: 4, title: 'Analista de pago a proveedores', zone: 'Tortuguitas', area: 'Administración', ref: 'ADM5523105', shift: 'Lunes a viernes · 8 a 17 h', minutes: 20, benefits: ['Esquema híbrido', 'Obra social'], match: 74, reason: 'Es parecida a tus postulaciones administrativas.' },
    { id: 5, title: 'Responsable de Recursos Humanos', zone: 'Salta', area: 'RR. HH.', ref: 'RRH5512135', shift: 'Jornada completa', minutes: 10, benefits: ['Prepaga', 'Bono anual'], match: 52, reason: 'Pide liderazgo y 3 años de experiencia: hoy tu perfil queda algo lejos.' },
    { id: 6, title: 'Operario/a metalúrgico', zone: 'Villa Maipú', area: 'Industria', ref: 'IND3640414', shift: 'Turno mañana · 6 a 14 h', minutes: 22, benefits: ['Comedor en planta', 'Ropa de trabajo'], match: 77, reason: 'Operación en planta, cerca de tu zona. Tu experiencia en producción suma.' },
    { id: 7, title: 'Jefe/a de Ventas', zone: 'CABA', area: 'Comercial', ref: 'COM5844162', shift: 'Jornada completa', minutes: 30, benefits: ['Auto', 'Comisiones', 'Prepaga'], match: 55, reason: 'Pide liderar equipos comerciales: hoy tu perfil queda algo lejos.' },
  ];

  const application = (
    id: string,
    jobId: number,
    data: Omit<Application, 'id' | 'jobId' | 'ref' | 'title' | 'zone' | 'area'>,
  ): Application => {
    const job = jobs[jobId];
    return { id, jobId, ref: job.ref, title: job.title, zone: job.zone, area: job.area, ...data };
  };

  const applications: Application[] = [
    application('p1', 1, {
      stage: 3,
      match: 92,
      status: 'Entrevista confirmada',
      appliedAt: at(-6, 9, 12),
      history: hist(
        [at(-6, 9, 12), 'Te postulaste desde el portal.'],
        [at(-3, 17, 20), 'Hiciste la entrevista con el agente de IA. Tu match: 92 %.'],
        [at(-2, 10, 5), 'Mariana Sosa (selectora) te propuso una reunión por Teams.'],
        [at(-2, 10, 40), 'Confirmaste la reunión.'],
      ),
      nextStep: 'Entrevista con la selectora por Teams',
    }),
    application('p2', 4, {
      stage: 3,
      match: 84,
      status: 'Confirmá tu entrevista',
      appliedAt: at(-8, 18, 40),
      history: hist(
        [at(-8, 18, 40), 'Te postulaste desde la web.'],
        [at(-5, 12, 0), 'Hiciste la entrevista con el agente de IA. Tu match: 84 %.'],
        [at(-1, 16, 30), 'Julián Pereyra (selector) te propuso una reunión por Teams.'],
      ),
      nextStep: 'Confirmar la reunión por Teams',
    }),
    application('p3', 0, {
      stage: 2,
      match: null,
      status: 'Falta tu entrevista con el agente',
      appliedAt: at(-1, 20, 15),
      history: hist([at(-1, 20, 15), 'Te postulaste desde el portal.']),
      nextStep: 'Hacer la entrevista con el agente de IA',
    }),
    application('p4', 2, {
      stage: 4,
      outcome: 'rejected',
      match: 71,
      status: 'No avanzó en esta búsqueda',
      appliedAt: at(-19, 11, 0),
      history: hist(
        [at(-19, 11, 0), 'Te postulaste.'],
        [at(-16, 15, 10), 'Hiciste la entrevista con el agente de IA. Tu match: 71 %.'],
        [at(-12, 11, 0), 'Entrevista con la selectora Paula Giménez.'],
        [at(-9, 10, 0), 'La empresa eligió otro perfil con más experiencia en ventas telefónicas.'],
      ),
      nextStep: '',
    }),
  ];

  const interviews: Interview[] = [
    { id: 'e1', type: 'recruiter', applicationId: 'p1', title: 'Entrevista con la selectora', with: 'Mariana Sosa', startsAt: nextWeekday(5, 10), durationMin: 30, status: 'confirmed' },
    { id: 'e2', type: 'recruiter', applicationId: 'p2', title: 'Entrevista con el selector', with: 'Julián Pereyra', startsAt: nextWeekday(2, 11), durationMin: 30, status: 'pending' },
    { id: 'e3', type: 'agent', applicationId: 'p3', title: 'Entrevista con el agente de IA', with: 'Agente de IA', startsAt: at(2, 18), durationMin: 10, status: 'confirmed' },
    { id: 'e0', type: 'agent', applicationId: 'p1', title: 'Entrevista con el agente de IA', with: 'Agente de IA', startsAt: at(-3, 17, 20), durationMin: 10, status: 'done' },
    { id: 'e00', type: 'recruiter', applicationId: 'p4', title: 'Entrevista con la selectora', with: 'Paula Giménez', startsAt: at(-12, 11), durationMin: 30, status: 'done' },
  ];

  const documents: CandidateDocument[] = [
    { id: 'd1', kind: 'dni', name: 'DNI (frente y dorso)', required: true, fileName: 'DNI_Camila_Rojas.jpg' },
    { id: 'd2', kind: 'cv', name: 'Currículum vitae', required: true, fileName: 'CV_Camila_Rojas.pdf' },
    { id: 'd3', kind: 'cuil', name: 'Constancia de CUIL', required: true, fileName: null, reason: `La piden ${jobs[1].ref} y ${jobs[4].ref}` },
    { id: 'd4', kind: 'secondary-certificate', name: 'Certificado de estudios secundarios', required: true, fileName: null, reason: `Pedido por ${jobs[1].ref}` },
    { id: 'd5', kind: 'criminal-record', name: 'Certificado de antecedentes penales', required: false, fileName: null, reason: 'Opcional: suma puntos en puestos de seguridad' },
  ];

  const messages: InboxMessage[] = [
    {
      id: 'm1', unread: true, channel: 'email', from: 'Mariana Sosa · Grupo Gestión', subject: 'Tu entrevista por Teams', receivedAt: at(-2, 10, 40), interviewId: 'e1',
      body: [
        'Hola Camila:',
        `Gracias por hacer la entrevista con nuestro agente. Tu perfil encaja muy bien con la búsqueda de ${jobs[1].title.toLowerCase()} y quisiera conocerte.`,
        'Te espero en una reunión virtual de 30 minutos. Solo necesitás un celular o una compu con cámara y micrófono.',
        'Un abrazo,<br>Mariana',
      ],
    },
    {
      id: 'm2', unread: true, channel: 'email', from: 'Julián Pereyra · Grupo Gestión', subject: `Propuesta de reunión para ${jobs[4].title}`, receivedAt: at(-1, 16, 30), interviewId: 'e2',
      body: [
        'Hola Camila:',
        'Vi tu entrevista con el agente y me gustaría charlar con vos. ¿Te queda bien la fecha que te propongo? Confirmala desde tu portal o pedime otro horario.',
        'Saludos,<br>Julián',
      ],
    },
    {
      id: 'm3', unread: false, channel: 'whatsapp', from: 'Grupo Gestión', subject: 'Recordatorio: faltan documentos', receivedAt: at(-1, 9), aboutDocuments: true,
      body: [`Hola Camila, para avanzar con tu postulación ${jobs[1].ref} necesitamos tu constancia de CUIL y tu certificado de estudios. Podés subirlos desde tu portal en menos de 2 minutos.`],
    },
    {
      id: 'm4', unread: false, channel: 'email', from: 'Grupo Gestión', subject: `Recibimos tu postulación a ${jobs[0].title}`, receivedAt: at(-1, 20, 16), applicationId: 'p3',
      body: [
        'Hola Camila:',
        `Recibimos tu postulación (REF ${jobs[0].ref}). El siguiente paso es una entrevista breve con nuestro agente de IA. La podés hacer cuando quieras, en unos 10 minutos.`,
      ],
    },
  ];

  const profile: CandidateProfile = {
    name: 'Camila Rojas',
    phone: '11 5550-0142',
    location: 'Monte Grande, Buenos Aires',
    education: '',
    availability: ['Mañana', 'Tarde'],
    mobility: ['Transporte público'],
    experience: '',
    cvFileName: 'CV_Camila_Rojas.pdf',
    sizes: { pants: '', shirt: '', shoes: '' },
  };

  return { profile, jobs, applications, interviews, documents, messages };
}
