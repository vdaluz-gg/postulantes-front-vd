import { AUDIENCES, SiteConfig } from './site-config.model';
import {
  addField,
  addItem,
  addSection,
  duplicateField,
  findField,
  findIssues,
  findItem,
  moveField,
  moveItem,
  removeField,
  removeItem,
  uniqueId,
  updateField,
  updateItem,
} from './site-config.ops';
import { SITE_CONFIG_SEED } from './site-config.seed';

const seed: SiteConfig = SITE_CONFIG_SEED;
const fieldIds = (config: SiteConfig, sectionId: string) =>
  config.audiences.postulantes.sections.find((s) => s.id === sectionId)!.fields.map((f) => f.id);

describe('configuración inicial', () => {
  it('trae secciones, documentos, avisos y canales para los tres públicos', () => {
    for (const audience of AUDIENCES) {
      const a = seed.audiences[audience];
      expect(a.audience).toBe(audience);
      expect(a.sections.length).toBeGreaterThan(0);
      expect(a.documents.length).toBeGreaterThan(0);
      expect(a.channels.length).toBeGreaterThan(0);
    }
  });

  it('no tiene problemas que impidan publicar', () => {
    expect(findIssues(seed)).toEqual([]);
  });

  it('incluye los campos de la maqueta de cada portal', () => {
    expect(fieldIds(seed, 'application')).toEqual([
      'firstName',
      'lastName',
      'dni',
      'cuil',
      'email',
      'whatsapp',
      'zone',
      'position',
    ]);
    const absence = seed.audiences.colaboradores.sections.find((s) => s.id === 'absence')!;
    expect(absence.fields.map((f) => f.label)).toEqual([
      'Desde',
      'Hasta',
      'Motivo',
      'Comentario (opcional)',
    ]);
    expect(seed.audiences.clientes.documents.map((d) => d.name)).toContain(
      'Certificado de cobertura ART',
    );
  });

  it('no contiene datos personales reales', () => {
    const text = JSON.stringify(seed);
    expect(text).not.toMatch(/@grupo-gestion\.com\.ar|banksa/i);
  });
});

describe('operaciones del editor', () => {
  it('genera ids sin repetir', () => {
    expect(uniqueId('campo', [])).toBe('campo');
    expect(uniqueId('campo', ['campo', 'campo-2'])).toBe('campo-3');
  });

  it('edita un campo sin tocar el original', () => {
    const next = updateField(seed, 'postulantes', 'application', 'dni', {
      label: 'Documento',
      required: false,
    });
    expect(findField(next, 'postulantes', 'application', 'dni')).toEqual(
      expect.objectContaining({ label: 'Documento', required: false }),
    );
    expect(findField(seed, 'postulantes', 'application', 'dni')!.label).toBe('DNI');
  });

  it('al pasar un campo a lista le agrega opciones', () => {
    const next = updateField(seed, 'postulantes', 'application', 'zone', { type: 'select' });
    expect(findField(next, 'postulantes', 'application', 'zone')!.options).toHaveLength(2);
  });

  it('agrega un campo después del elegido o al final', () => {
    const after = addField(seed, 'postulantes', 'application', 'dni');
    expect(fieldIds(after.config, 'application')).toEqual([
      'firstName',
      'lastName',
      'dni',
      'campo',
      'cuil',
      'email',
      'whatsapp',
      'zone',
      'position',
    ]);
    const atEnd = addField(after.config, 'postulantes', 'application');
    expect(atEnd.id).toBe('campo-2');
    expect(fieldIds(atEnd.config, 'application').at(-1)).toBe('campo-2');
  });

  it('duplica, mueve y borra campos', () => {
    const dup = duplicateField(seed, 'postulantes', 'application', 'dni');
    expect(dup.id).toBe('dni-copia');
    expect(findField(dup.config, 'postulantes', 'application', 'dni-copia')!.label).toBe(
      'DNI (copia)',
    );

    const moved = moveField(seed, 'postulantes', 'application', 'dni', -1);
    expect(fieldIds(moved, 'application').slice(0, 3)).toEqual(['firstName', 'dni', 'lastName']);
    expect(moveField(seed, 'postulantes', 'application', 'firstName', -1)).toEqual(seed);

    const removed = removeField(seed, 'postulantes', 'application', 'zone');
    expect(fieldIds(removed, 'application')).not.toContain('zone');
  });

  it('suma una sección vacía', () => {
    const { config, id } = addSection(seed, 'clientes');
    expect(config.audiences.clientes.sections.at(-1)).toEqual(
      expect.objectContaining({ id, title: 'Nueva sección', fields: [] }),
    );
  });

  it('suma, edita, mueve y borra documentos, avisos y redes', () => {
    const doc = addItem(seed, 'clientes', 'documents');
    expect(findItem(doc.config, 'clientes', 'documents', doc.id)!.name).toBe('Nuevo documento');

    const alert = addItem(seed, 'colaboradores', 'alerts');
    const edited = updateItem(alert.config, 'colaboradores', 'alerts', alert.id, {
      title: 'Feriado',
      active: true,
    });
    expect(findItem(edited, 'colaboradores', 'alerts', alert.id)).toEqual(
      expect.objectContaining({ title: 'Feriado', active: true }),
    );

    const net = addItem(seed, 'postulantes', 'channels');
    expect(net.config.audiences.postulantes.channels.at(-1)!.kind).toBe('instagram');
    const up = moveItem(net.config, 'postulantes', 'channels', net.id, -1);
    expect(up.audiences.postulantes.channels.at(-2)!.id).toBe(net.id);
    expect(
      removeItem(up, 'postulantes', 'channels', net.id).audiences.postulantes.channels,
    ).toHaveLength(3);
  });
});

describe('revisión antes de publicar', () => {
  it('marca etiquetas vacías, listas sin opciones y validaciones inválidas', () => {
    let config = updateField(seed, 'postulantes', 'application', 'zone', { label: ' ' });
    config = updateField(config, 'postulantes', 'application', 'dni', {
      validation: { pattern: '([' },
    });
    config = updateField(config, 'postulantes', 'profile', 'education', { options: [] });
    expect(findIssues(config).map((i) => i.message)).toEqual([
      'La validación de «DNI» no es una expresión válida.',
      'El campo no tiene etiqueta.',
      '«Nivel de estudios» necesita al menos una opción.',
    ]);
  });

  it('no deja publicar sin los datos que necesita el backend para registrar la postulación', () => {
    let config = updateField(seed, 'postulantes', 'application', 'dni', { visible: false });
    config = updateField(config, 'postulantes', 'application', 'whatsapp', { required: false });
    config = removeField(config, 'postulantes', 'application', 'email');
    expect(findIssues(config).map((i) => i.message)).toEqual([
      'Falta el campo «email»: el sistema lo necesita para registrar la postulación.',
      '«DNI» lo necesita el sistema para registrar la postulación: dejalo visible y obligatorio.',
      '«WhatsApp» lo necesita el sistema para registrar la postulación: dejalo visible y obligatorio.',
    ]);
    // La zona y los campos nuevos sí se pueden ocultar o volver opcionales.
    expect(
      findIssues(updateField(seed, 'postulantes', 'application', 'zone', { visible: false })),
    ).toEqual([]);
  });

  it('pide https en las redes y fechas en orden en los avisos', () => {
    let config = updateItem(seed, 'postulantes', 'channels', 'linkedin', {
      value: 'linkedin.com/empresa',
    });
    config = updateItem(config, 'postulantes', 'alerts', 'no-money', {
      startsOn: '2026-12-10',
      endsOn: '2026-12-01',
    });
    expect(findIssues(config)).toEqual([
      expect.objectContaining({
        message: 'El aviso «Cuidado con los cobros» termina antes de empezar.',
      }),
      expect.objectContaining({
        selection: { kind: 'channels', audience: 'postulantes', id: 'linkedin' },
        message: '«LinkedIn» tiene que ser un enlace que empiece con https://.',
      }),
    ]);
  });
});
