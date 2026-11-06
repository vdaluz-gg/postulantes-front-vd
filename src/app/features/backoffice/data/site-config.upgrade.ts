import { APPLICATION_SECTION, AudienceConfig, FieldConfig, SiteConfig } from './site-config.model';
import { SITE_CONFIG_SEED } from './site-config.seed';

const seedField = (id: string): FieldConfig =>
  SITE_CONFIG_SEED.audiences.postulantes.sections
    .find((s) => s.id === APPLICATION_SECTION)!
    .fields.find((f) => f.id === id)!;

/**
 * Pone al día el formulario de postulación de una configuración guardada antes de que nombre y
 * apellido fueran dos campos y de que existiera el CUIL:
 * - "Nombre y apellido" (`fullName`) pasa a ser "Nombre" y "Apellido", en el mismo lugar.
 * - Si falta el CUIL, se suma después del DNI (opcional).
 * Lo demás (campos agregados, textos, orden) queda como estaba. Si ya está al día, devuelve el
 * mismo objeto.
 */
export function upgradeAudience(audience: AudienceConfig): AudienceConfig {
  if (audience.audience !== 'postulantes') return audience;
  let changed = false;
  const sections = audience.sections.map((section) => {
    if (section.id !== APPLICATION_SECTION) return section;
    let fields: FieldConfig[] = [...section.fields];
    const legacy = fields.findIndex((f) => f.id === 'fullName');
    if (legacy >= 0 && !fields.some((f) => f.id === 'firstName' || f.id === 'lastName')) {
      fields.splice(legacy, 1, seedField('firstName'), seedField('lastName'));
      changed = true;
    } else if (legacy >= 0) {
      fields = fields.filter((f) => f.id !== 'fullName');
      changed = true;
    }
    if (!fields.some((f) => f.id === 'cuil')) {
      const dni = fields.findIndex((f) => f.id === 'dni');
      fields.splice(dni >= 0 ? dni + 1 : fields.length, 0, seedField('cuil'));
      changed = true;
    }
    return { ...section, fields };
  });
  return changed ? { ...audience, sections } : audience;
}

export function upgradeConfig(config: SiteConfig): SiteConfig {
  const postulantes = upgradeAudience(config.audiences.postulantes);
  return postulantes === config.audiences.postulantes
    ? config
    : { ...config, audiences: { ...config.audiences, postulantes } };
}
