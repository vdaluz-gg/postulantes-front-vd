import {
  AudienceConfig,
  FieldConfig,
  FieldOption,
  FieldType,
  SiteConfig,
} from './site-config.model';

/**
 * Configuración inicial: los campos, documentos, avisos, canales y textos que hoy muestran la
 * portada y los portales de la maqueta. Los datos de contacto son de ejemplo.
 */

const field = (
  id: string,
  label: string,
  type: FieldType,
  extra: Partial<FieldConfig> = {},
): FieldConfig => ({
  id,
  label,
  type,
  required: false,
  visible: true,
  readonly: false,
  tone: 'neutral',
  ...extra,
});

const opts = (...labels: string[]): FieldOption[] =>
  labels.map((label) => ({
    value: label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    label,
  }));

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => String(from + i * step));

/** Talles de uniforme: iguales en el portal del postulante y en el del colaborador. */
const uniformFields = (): FieldConfig[] => [
  field('pantsSize', 'Talle de pantalón', 'select', {
    placeholder: 'Elegí tu talle',
    options: opts(...range(36, 58, 2)),
  }),
  field('shirtSize', 'Talle de camisa', 'select', {
    placeholder: 'Elegí tu talle',
    options: opts('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'),
  }),
  field('shoeSize', 'Calzado (botas o zapatos)', 'select', {
    placeholder: 'Elegí tu número',
    options: opts(...range(35, 47, 1)),
  }),
];

const otpField = () =>
  field('code', 'Código de 6 números', 'text', {
    required: true,
    placeholder: '000000',
    validation: { pattern: '^\\d{6}$', maxLength: 6, message: 'El código tiene 6 números.' },
  });

const postulantes: AudienceConfig = {
  audience: 'postulantes',
  sections: [
    {
      id: 'application',
      title: 'Postulación',
      description: 'Datos que pide la portada al postularse. La IA los completa con el CV.',
      screen: 'Portada · Postularme',
      fields: [
        field('fullName', 'Nombre y apellido', 'text', {
          required: true,
          placeholder: 'Como figura en tu DNI',
          validation: {
            pattern: "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+\\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$",
            message: 'Sumá tu apellido.',
          },
        }),
        field('dni', 'DNI', 'text', {
          required: true,
          placeholder: 'Sin puntos',
          validation: { pattern: '^\\d{7,8}$', message: 'Revisá el DNI: son 7 u 8 números.' },
        }),
        field('email', 'Email', 'email', {
          required: true,
          placeholder: 'nombre@ejemplo.com',
          validation: { message: 'Revisá el email, por ejemplo nombre@ejemplo.com.' },
        }),
        field('whatsapp', 'WhatsApp', 'tel', {
          required: true,
          placeholder: '11 5555-0000',
          help: 'Te avisamos por nuestro número oficial.',
          validation: { message: 'Revisá el número: son 10 dígitos con el código de área.' },
        }),
        field('zone', 'Zona donde vivís', 'text', {
          required: true,
          placeholder: 'Localidad o barrio',
        }),
        field('position', 'Puesto', 'text', {
          readonly: true,
          tone: 'section',
          help: 'Se completa con la oferta elegida.',
        }),
      ],
    },
    {
      id: 'profile',
      title: 'Mi perfil',
      description: 'Datos que el postulante completa en su portal.',
      screen: 'Portal · Mi perfil',
      fields: [
        field('name', 'Nombre y apellido', 'text', { required: true }),
        field('email', 'Correo', 'email', { readonly: true, help: 'Es el usuario para ingresar.' }),
        field('phone', 'Teléfono (WhatsApp)', 'tel', { required: true }),
        field('locality', 'Localidad', 'text', { required: true }),
        field('education', 'Nivel de estudios', 'select', {
          placeholder: 'Elegí una opción',
          options: opts(
            'Primario completo',
            'Secundario incompleto',
            'Secundario completo',
            'Terciario o universitario en curso',
            'Terciario o universitario completo',
          ),
        }),
        field('availability', 'Disponibilidad horaria', 'chips', {
          options: opts('Mañana', 'Tarde', 'Noche', 'Fines de semana'),
        }),
        field('mobility', '¿Cómo te movés?', 'chips', {
          options: opts('Transporte público', 'Vehículo propio', 'Moto o bici'),
        }),
        field('experience', 'Experiencia laboral', 'textarea', {
          placeholder: 'Contanos dónde trabajaste y qué hacías.',
        }),
        ...uniformFields(),
      ],
    },
  ],
  documents: [
    {
      id: 'cv',
      name: 'CV',
      required: true,
      formats: ['pdf', 'doc', 'docx'],
      maxSizeMb: 5,
      expires: false,
      help: 'La IA lo lee y completa tus datos.',
    },
    {
      id: 'dni',
      name: 'DNI (frente y dorso)',
      required: true,
      formats: ['pdf', 'jpg', 'png'],
      maxSizeMb: 5,
      expires: false,
    },
    {
      id: 'cuil',
      name: 'Constancia de CUIL',
      required: true,
      formats: ['pdf', 'jpg', 'png'],
      maxSizeMb: 5,
      expires: false,
    },
    {
      id: 'studies',
      name: 'Certificado de estudios secundarios',
      required: true,
      formats: ['pdf', 'jpg', 'png'],
      maxSizeMb: 5,
      expires: false,
    },
    {
      id: 'record',
      name: 'Certificado de antecedentes penales',
      required: false,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: true,
    },
  ],
  alerts: [
    {
      id: 'no-money',
      level: 'info',
      title: 'Cuidado con los cobros',
      message:
        'Grupo Gestión nunca te pide dinero para una entrevista ni para ingresar a trabajar.',
      active: true,
    },
  ],
  channels: [
    {
      id: 'wa',
      kind: 'whatsapp',
      label: 'WhatsApp oficial',
      value: '+54 9 11 0000-0000',
      visible: true,
      note: 'Lun a vie · 9 a 17 h',
    },
    {
      id: 'mail',
      kind: 'email',
      label: 'Correo de selección',
      value: 'seleccion@ejemplo.com',
      visible: true,
    },
    {
      id: 'linkedin',
      kind: 'linkedin',
      label: 'LinkedIn',
      value: 'https://www.linkedin.com/company/ejemplo',
      visible: true,
    },
  ],
  copy: [
    {
      id: 'kicker',
      label: 'Etiqueta superior',
      value: 'Postulantes · Busco trabajo',
      multiline: false,
    },
    {
      id: 'title',
      label: 'Título',
      value: 'El trabajo de la Argentina, en movimiento.',
      multiline: false,
    },
    {
      id: 'searchPlaceholder',
      label: 'Texto del buscador',
      value: 'Contale a la IA qué sabés hacer y dónde vivís',
      multiline: false,
    },
    {
      id: 'suggestions',
      label: 'Sugerencias de búsqueda (una por línea)',
      value: 'Chofer cerca de Moreno\nFábrica en Monte Grande\nTrabajo de oficina\nAlgo en Salta',
      multiline: true,
    },
    {
      id: 'footnote',
      label: 'Pie del panel',
      value: 'Matching con IA · 14 sucursales en todo el país',
      multiline: false,
    },
  ],
};

const clientes: AudienceConfig = {
  audience: 'clientes',
  sections: [
    {
      id: 'login',
      title: 'Ingreso',
      description: 'Ingreso sin contraseña: CUIT o mail y un código.',
      screen: 'Portal · Ingresar',
      fields: [
        field('identifier', 'Tu CUIT o mail de empresa', 'text', {
          required: true,
          placeholder: 'Ej.: 30-…',
          validation: {
            message: 'Revisá el dato: un CUIT tiene 11 números o escribí un mail válido.',
          },
        }),
        otpField(),
      ],
    },
    {
      id: 'company',
      title: 'Mi empresa',
      description: 'Datos de la empresa y sus domicilios.',
      screen: 'Portal · Mi empresa',
      fields: [
        field('legalName', 'Razón social', 'text', { required: true, readonly: true }),
        field('cuit', 'CUIT', 'text', {
          required: true,
          readonly: true,
          placeholder: '30-00000000-0',
          validation: { pattern: '^\\d{2}-?\\d{8}-?\\d$', message: 'El CUIT tiene 11 números.' },
        }),
        field('activity', 'Actividad', 'text'),
        field('yearsActive', 'Antigüedad (años)', 'number', { validation: { min: 0 } }),
        field('clientSince', 'Cliente desde (año)', 'number', {
          validation: { min: 1990, max: 2100 },
        }),
        field('fiscalAddress', 'Domicilio fiscal', 'text', { required: true }),
        field('siteAddress', 'Domicilio de explotación', 'text'),
        field('agreement', 'Convenio colectivo', 'select', {
          options: opts(
            'CCT 130/75 Empleados de comercio',
            'CCT 40/89 Camioneros',
            'CCT 389/04 Gastronómicos',
          ),
        }),
      ],
    },
    {
      id: 'contacts',
      title: 'Contactos y usuarios',
      description: 'Personas de la empresa y quién usa el portal.',
      screen: 'Portal · Mi empresa',
      fields: [
        field('contactName', 'Nombre del contacto', 'text', { required: true }),
        field('contactRole', 'Cargo', 'text', { placeholder: 'Ej.: Jefa de RR. HH.' }),
        field('contactEmail', 'Correo', 'email', { required: true }),
        field('userRole', 'Rol en el portal', 'select', {
          required: true,
          options: opts('RR. HH.', 'Administración', 'Gerencia'),
        }),
      ],
    },
    {
      id: 'quote-staff',
      title: 'Cotizador · Personal',
      description: 'Cotización de dotación (eventual o tercerizado).',
      screen: 'Portal · Cotizar',
      fields: [
        field('quoteAgreement', 'Convenio', 'select', {
          required: true,
          options: opts(
            'Comercio (CCT 130/75)',
            'Camioneros (CCT 40/89)',
            'Gastronómicos (CCT 389/04)',
          ),
        }),
        field('quoteCategory', 'Categoría', 'chips', {
          required: true,
          options: opts(
            'Maestranza A',
            'Administrativo A',
            'Chofer categoría 1',
            'Ayudante de cocina',
            'Mozo/a',
          ),
        }),
        field('quoteProvince', 'Provincia', 'select', {
          required: true,
          options: opts('Buenos Aires', 'CABA'),
        }),
        field('quoteZone', 'Zona', 'select', {
          options: opts('Zona A (Dto. 814)', 'Zona general', 'CABA'),
        }),
        field('quotePeople', 'Cantidad de personas', 'number', {
          required: true,
          validation: { min: 1 },
        }),
        field('quoteMode', 'Modalidad', 'chips', { options: opts('Continua', 'Discontinua') }),
        field('quoteUniform', 'Ropa y EPP a cargo de GG', 'switch'),
        field('quoteMedical', 'Estudios médicos preocupacionales (básico de ley)', 'switch'),
        field('quotePaymentTerm', 'Plazo de pago (días)', 'chips', {
          options: opts('15', '30', '45', '60', '75', '90'),
        }),
      ],
    },
    {
      id: 'quote-search',
      title: 'Cotizador · Búsqueda',
      description: 'Búsqueda y selección de un puesto.',
      screen: 'Portal · Cotizar',
      fields: [
        field('searchPosition', 'Puesto a cubrir', 'text', {
          required: true,
          placeholder: 'Ej.: Analista contable senior',
        }),
        field('searchSalary', 'Sueldo bruto ofrecido', 'number', {
          required: true,
          validation: { min: 0, step: 10000 },
        }),
        field('searchPositions', 'Posiciones', 'number', {
          required: true,
          validation: { min: 1 },
        }),
        field('searchZone', 'Zona', 'select', { options: opts('CABA', 'Buenos Aires') }),
      ],
    },
    {
      id: 'quote-payroll',
      title: 'Cotizador · Payroll y otros',
      description: 'Liquidación de sueldos, estudios, RPO y recibos digitales.',
      screen: 'Portal · Cotizar',
      fields: [
        field('payrollEmployees', 'Cantidad de empleados', 'number', { validation: { min: 1 } }),
        field('payrollFrequency', 'Frecuencia', 'chips', { options: opts('Mensual', 'Quincenal') }),
        field('medicalStudies', 'Cantidad de estudios', 'number', { validation: { min: 1 } }),
        field('rpoSearches', 'Búsquedas estimadas por año', 'number', { validation: { min: 1 } }),
        field('digitalReceipts', 'Recibos por mes', 'number', { validation: { min: 1 } }),
      ],
    },
    {
      id: 'advance',
      title: 'Anticipo a un empleado',
      description: 'Pedido de anticipo desde Mi gente.',
      screen: 'Portal · Mi gente',
      fields: [
        field('advanceAmount', 'Monto del anticipo', 'number', {
          required: true,
          validation: { min: 10000, step: 10000 },
        }),
      ],
    },
  ],
  documents: [
    {
      id: 'arca',
      name: 'Constancia de inscripción AFIP',
      required: true,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: false,
    },
    {
      id: 'iibb',
      name: 'Constancia de Ingresos Brutos',
      required: true,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: false,
    },
    {
      id: 'f931',
      name: 'Formulario 931',
      required: true,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: true,
      help: 'El del último período.',
    },
    {
      id: 'life',
      name: 'Seguro de vida obligatorio',
      required: true,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: true,
    },
    {
      id: 'art',
      name: 'Certificado de cobertura ART',
      required: true,
      formats: ['pdf'],
      maxSizeMb: 5,
      expires: true,
    },
  ],
  alerts: [
    {
      id: 'missing-doc',
      level: 'warning',
      title: 'Falta un documento',
      message: 'Te falta subir un documento: sin él no podemos avanzar con la facturación.',
      active: true,
      ctaLabel: 'Subir documento',
      ctaHref: '#documentacion',
    },
    {
      id: 'quote',
      level: 'positive',
      title: 'Cotizá en un minuto',
      message: 'Cotizá tu próximo servicio en un minuto.',
      active: true,
      ctaLabel: 'Cotizar',
      ctaHref: '#cotizar',
    },
  ],
  channels: [
    {
      id: 'exec-mail',
      kind: 'email',
      label: 'Tu ejecutivo de cuenta',
      value: 'ejecutivo@ejemplo.com',
      visible: true,
    },
    {
      id: 'exec-phone',
      kind: 'phone',
      label: 'Teléfono del ejecutivo',
      value: '11 0000-0000',
      visible: true,
    },
  ],
  copy: [
    { id: 'title', label: 'Título del hero', value: 'Hola. ¿Qué necesitás hoy?', multiline: false },
    {
      id: 'assistant',
      label: 'Texto del asistente',
      value: 'Preguntale al asistente',
      multiline: false,
    },
    {
      id: 'payment',
      label: 'Cómo pagar',
      value: 'Transferencia a la cuenta que figura en cada factura.',
      multiline: true,
    },
  ],
};

const colaboradores: AudienceConfig = {
  audience: 'colaboradores',
  sections: [
    {
      id: 'login',
      title: 'Ingreso',
      description: 'Ingreso con DNI o legajo y un código por mensaje.',
      screen: 'Portal · Ingresar',
      fields: [
        field('identifier', 'Tu DNI o número de legajo', 'text', {
          required: true,
          placeholder: 'Solo números',
          validation: {
            pattern: '^\\d{5,9}$',
            message: 'Revisá el dato: ingresá solo números, entre 5 y 9.',
          },
        }),
        otpField(),
      ],
    },
    {
      id: 'profile',
      title: 'Mi perfil',
      description: 'Datos del legajo. Los de solo lectura se corrigen pidiéndolo desde Consultas.',
      screen: 'Portal · Mi perfil',
      fields: [
        field('name', 'Nombre y apellido', 'text', { readonly: true }),
        field('employeeNumber', 'Legajo', 'text', { readonly: true }),
        field('dni', 'DNI', 'text', {
          readonly: true,
          help: 'Se muestra oculto salvo los últimos 3 números.',
        }),
        field('position', 'Puesto', 'text', { readonly: true }),
        field('company', 'Empresa', 'text', { readonly: true }),
        field('site', 'Sede', 'text', { readonly: true }),
        field('startDate', 'Ingreso', 'date', { readonly: true }),
        ...uniformFields(),
      ],
    },
    {
      id: 'ticket',
      title: 'Nueva consulta',
      description: 'Consulta a RR. HH. La IA intenta responderla antes de enviarla.',
      screen: 'Portal · Consultas',
      fields: [
        field('topic', 'Tema', 'select', {
          required: true,
          options: opts(
            'Sueldo',
            'Recibo',
            'Vacaciones',
            'Licencias',
            'Tarjeta de débito',
            'Datos personales',
            'Otro tema',
          ),
        }),
        field('subject', 'Asunto', 'text', { placeholder: 'Por ejemplo: no veo mi recibo' }),
        field('message', 'Mensaje', 'textarea', {
          required: true,
          placeholder: 'Contanos con tus palabras.',
          validation: { message: 'Escribí un asunto o un mensaje.' },
        }),
      ],
    },
    {
      id: 'absence',
      title: 'Avisar una ausencia',
      description: 'Si el motivo es enfermedad, se pide el certificado dentro de las 48 h.',
      screen: 'Portal · Ausencias',
      fields: [
        field('from', 'Desde', 'date', { required: true }),
        field('to', 'Hasta', 'date', {
          required: true,
          validation: { message: '«Hasta» no puede ser anterior a «Desde».' },
        }),
        field('reason', 'Motivo', 'select', {
          required: true,
          options: opts('Enfermedad', 'Trámite personal', 'Familiar enfermo', 'Estudio', 'Otro'),
        }),
        field('comment', 'Comentario (opcional)', 'textarea'),
      ],
    },
  ],
  documents: [
    {
      id: 'medical',
      name: 'Certificado médico',
      required: true,
      formats: ['pdf', 'jpg', 'png'],
      maxSizeMb: 5,
      expires: false,
      help: 'Para ausencias por enfermedad, dentro de las 48 h.',
    },
  ],
  alerts: [
    {
      id: 'certificate',
      level: 'warning',
      title: 'Falta el certificado',
      message:
        'Te falta el certificado: tenés hasta hoy a las 23:59 h para presentarlo y que no se descuente el día.',
      active: true,
      ctaLabel: 'Subir certificado',
      ctaHref: '#ausencias',
    },
    {
      id: 'receipt',
      level: 'info',
      title: 'Recibo listo',
      message: 'Tu recibo está listo para que des tu conformidad.',
      active: true,
      ctaLabel: 'Ver recibo',
      ctaHref: '#recibos',
    },
  ],
  channels: [
    {
      id: 'wa',
      kind: 'whatsapp',
      label: 'WhatsApp oficial',
      value: '+54 9 11 0000-0000',
      visible: true,
      note: 'Lun a vie · 9 a 17 h',
    },
    {
      id: 'phone',
      kind: 'phone',
      label: 'Atención al colaborador',
      value: '+54 9 11 0000-0000',
      visible: true,
      note: 'Lun a vie · 9 a 17 h',
    },
  ],
  copy: [
    { id: 'payHours', label: 'Horario de acreditación', value: '9:00 a 13:00 h', multiline: false },
    {
      id: 'payMethod',
      label: 'Cómo cobrás',
      value: 'Cuenta sueldo · Acreditación bancaria',
      multiline: false,
    },
    {
      id: 'ticketReply',
      label: 'Respuesta automática a una consulta',
      value: 'Recibimos tu consulta. Te respondemos en un máximo de 24 horas hábiles.',
      multiline: true,
    },
  ],
};

export const SITE_CONFIG_SEED: SiteConfig = {
  version: 1,
  status: 'published',
  updatedAt: '2026-11-05T12:00:00.000Z',
  updatedBy: 'Configuración inicial',
  audiences: { postulantes, clientes, colaboradores },
};
