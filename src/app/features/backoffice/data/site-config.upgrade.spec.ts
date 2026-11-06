import { AudienceConfig, FieldConfig } from './site-config.model';
import { findIssues } from './site-config.ops';
import { SITE_CONFIG_SEED } from './site-config.seed';
import { upgradeAudience, upgradeConfig } from './site-config.upgrade';

const field = (id: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
  id,
  label,
  type: 'text',
  required: true,
  visible: true,
  readonly: false,
  tone: 'neutral',
  ...extra,
});

/** Formulario de postulación guardado antes de separar nombre y apellido y de sumar el CUIL. */
const legacy: AudienceConfig = {
  ...SITE_CONFIG_SEED.audiences.postulantes,
  sections: SITE_CONFIG_SEED.audiences.postulantes.sections.map((s) =>
    s.id === 'application'
      ? {
          ...s,
          fields: [
            field('fullName', 'Nombre y apellido'),
            field('campo', 'Segundo nombre'),
            field('dni', 'DNI'),
            field('email', 'Email', { type: 'email' }),
            field('whatsapp', 'WhatsApp', { type: 'tel' }),
          ],
        }
      : s,
  ),
};
const ids = (a: AudienceConfig) =>
  a.sections.find((s) => s.id === 'application')!.fields.map((f) => f.id);

describe('puesta al día de una configuración guardada', () => {
  it('"Nombre y apellido" pasa a ser Nombre y Apellido en su lugar, y suma el CUIL después del DNI', () => {
    const upgraded = upgradeAudience(legacy);
    expect(ids(upgraded)).toEqual([
      'firstName',
      'lastName',
      'campo',
      'dni',
      'cuil',
      'email',
      'whatsapp',
    ]);
    const fields = upgraded.sections.find((s) => s.id === 'application')!.fields;
    expect(fields.find((f) => f.id === 'cuil')).toEqual(
      expect.objectContaining({ label: 'CUIL', required: false }),
    );
    // Sin problemas para publicar: los datos que necesita el backend quedan visibles y obligatorios.
    const config = upgradeConfig({
      ...SITE_CONFIG_SEED,
      audiences: { ...SITE_CONFIG_SEED.audiences, postulantes: legacy },
    });
    expect(findIssues(config)).toEqual([]);
  });

  it('si ya está al día no cambia nada, y no toca los otros públicos', () => {
    expect(upgradeConfig(SITE_CONFIG_SEED)).toBe(SITE_CONFIG_SEED);
    expect(upgradeAudience(SITE_CONFIG_SEED.audiences.clientes)).toBe(
      SITE_CONFIG_SEED.audiences.clientes,
    );
  });

  it('si conviven el campo viejo y los nuevos, saca el viejo', () => {
    const both: AudienceConfig = {
      ...legacy,
      sections: legacy.sections.map((s) =>
        s.id === 'application'
          ? {
              ...s,
              fields: [...s.fields, field('firstName', 'Nombre'), field('lastName', 'Apellido')],
            }
          : s,
      ),
    };
    expect(ids(upgradeAudience(both))).not.toContain('fullName');
  });
});
