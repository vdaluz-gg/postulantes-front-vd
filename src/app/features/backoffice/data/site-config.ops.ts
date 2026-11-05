import {
  AlertConfig,
  Audience,
  AudienceConfig,
  ChannelConfig,
  CopyConfig,
  DocumentRequirement,
  FieldConfig,
  FormSection,
  SiteConfig,
  hasOptions,
} from './site-config.model';

/** Listas de una audiencia que se editan como elementos sueltos (no dentro de una sección). */
export type ItemList = 'documents' | 'alerts' | 'channels' | 'copy';
export type ItemOf<L extends ItemList> = AudienceConfig[L][number];

/** Elemento elegido en el editor. */
export type Selection =
  | { readonly kind: 'section'; readonly audience: Audience; readonly sectionId: string }
  | { readonly kind: 'field'; readonly audience: Audience; readonly sectionId: string; readonly id: string }
  | { readonly kind: ItemList; readonly audience: Audience; readonly id: string };

const withAudience = (config: SiteConfig, audience: Audience, fn: (a: AudienceConfig) => AudienceConfig): SiteConfig => ({
  ...config,
  audiences: { ...config.audiences, [audience]: fn(config.audiences[audience]) },
});

const withSection = (config: SiteConfig, audience: Audience, sectionId: string, fn: (s: FormSection) => FormSection) =>
  withAudience(config, audience, (a) => ({
    ...a,
    sections: a.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
  }));

const move = <T>(list: readonly T[], index: number, offset: number): readonly T[] => {
  const target = index + offset;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/** Primer id libre con ese prefijo: "campo", "campo-2", "campo-3"... */
export const uniqueId = (prefix: string, taken: Iterable<string>): string => {
  const used = new Set(taken);
  if (!used.has(prefix)) return prefix;
  let n = 2;
  while (used.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
};

export const findSection = (config: SiteConfig, audience: Audience, sectionId: string): FormSection | undefined =>
  config.audiences[audience].sections.find((s) => s.id === sectionId);

export const findField = (config: SiteConfig, audience: Audience, sectionId: string, id: string): FieldConfig | undefined =>
  findSection(config, audience, sectionId)?.fields.find((f) => f.id === id);

export const findItem = <L extends ItemList>(config: SiteConfig, audience: Audience, list: L, id: string): ItemOf<L> | undefined =>
  (config.audiences[audience][list] as readonly ItemOf<L>[]).find((item) => item.id === id);

/* ---------- Secciones ---------- */

export function updateSection(
  config: SiteConfig,
  audience: Audience,
  sectionId: string,
  patch: Partial<Pick<FormSection, 'title' | 'description' | 'screen'>>,
): SiteConfig {
  return withSection(config, audience, sectionId, (s) => ({ ...s, ...patch }));
}

export function addSection(config: SiteConfig, audience: Audience): { config: SiteConfig; id: string } {
  const id = uniqueId('seccion', config.audiences[audience].sections.map((s) => s.id));
  const section: FormSection = { id, title: 'Nueva sección', description: '', screen: 'Portal', fields: [] };
  return { config: withAudience(config, audience, (a) => ({ ...a, sections: [...a.sections, section] })), id };
}

export function removeSection(config: SiteConfig, audience: Audience, sectionId: string): SiteConfig {
  return withAudience(config, audience, (a) => ({ ...a, sections: a.sections.filter((s) => s.id !== sectionId) }));
}

/* ---------- Campos ---------- */

export function updateField(
  config: SiteConfig,
  audience: Audience,
  sectionId: string,
  id: string,
  patch: Partial<Omit<FieldConfig, 'id'>>,
): SiteConfig {
  return withSection(config, audience, sectionId, (s) => ({
    ...s,
    fields: s.fields.map((f) => {
      if (f.id !== id) return f;
      const next = { ...f, ...patch };
      // Al pasar a un tipo con opciones, arranca con dos para que el campo se pueda usar.
      if (patch.type && patch.type !== f.type && hasOptions(next.type) && !next.options?.length) {
        return { ...next, options: [{ value: 'opcion-1', label: 'Opción 1' }, { value: 'opcion-2', label: 'Opción 2' }] };
      }
      return next;
    }),
  }));
}

export function addField(
  config: SiteConfig,
  audience: Audience,
  sectionId: string,
  after?: string,
): { config: SiteConfig; id: string } {
  const section = findSection(config, audience, sectionId);
  if (!section) return { config, id: '' };
  const id = uniqueId('campo', section.fields.map((f) => f.id));
  const created: FieldConfig = {
    id,
    label: 'Nuevo campo',
    type: 'text',
    required: false,
    visible: true,
    readonly: false,
    tone: 'neutral',
  };
  const index = after ? section.fields.findIndex((f) => f.id === after) : -1;
  const at = index >= 0 ? index + 1 : section.fields.length;
  return {
    config: withSection(config, audience, sectionId, (s) => ({ ...s, fields: [...s.fields.slice(0, at), created, ...s.fields.slice(at)] })),
    id,
  };
}

export function duplicateField(config: SiteConfig, audience: Audience, sectionId: string, id: string): { config: SiteConfig; id: string } {
  const section = findSection(config, audience, sectionId);
  const source = section?.fields.find((f) => f.id === id);
  if (!section || !source) return { config, id };
  const copyId = uniqueId(`${id}-copia`, section.fields.map((f) => f.id));
  const at = section.fields.indexOf(source) + 1;
  const copy: FieldConfig = { ...source, id: copyId, label: `${source.label} (copia)` };
  return {
    config: withSection(config, audience, sectionId, (s) => ({ ...s, fields: [...s.fields.slice(0, at), copy, ...s.fields.slice(at)] })),
    id: copyId,
  };
}

export function removeField(config: SiteConfig, audience: Audience, sectionId: string, id: string): SiteConfig {
  return withSection(config, audience, sectionId, (s) => ({ ...s, fields: s.fields.filter((f) => f.id !== id) }));
}

export function moveField(config: SiteConfig, audience: Audience, sectionId: string, id: string, offset: -1 | 1): SiteConfig {
  return withSection(config, audience, sectionId, (s) => ({
    ...s,
    fields: move(s.fields, s.fields.findIndex((f) => f.id === id), offset),
  }));
}

/* ---------- Documentos, avisos, canales y textos ---------- */

const BLANK: { [L in ItemList]: (id: string) => ItemOf<L> } = {
  documents: (id): DocumentRequirement => ({ id, name: 'Nuevo documento', required: true, formats: ['pdf'], maxSizeMb: 5, expires: false }),
  alerts: (id): AlertConfig => ({ id, level: 'info', title: 'Nuevo aviso', message: 'Escribí el mensaje del aviso.', active: false }),
  channels: (id): ChannelConfig => ({ id, kind: 'instagram', label: 'Instagram', value: 'https://www.instagram.com/', visible: true }),
  copy: (id): CopyConfig => ({ id, label: 'Nuevo texto', value: '', multiline: false }),
};

const PREFIX: Readonly<Record<ItemList, string>> = { documents: 'documento', alerts: 'aviso', channels: 'canal', copy: 'texto' };

export function addItem<L extends ItemList>(config: SiteConfig, audience: Audience, list: L): { config: SiteConfig; id: string } {
  const items = config.audiences[audience][list] as readonly ItemOf<L>[];
  const id = uniqueId(PREFIX[list], items.map((i) => i.id));
  return {
    config: withAudience(config, audience, (a) => ({ ...a, [list]: [...items, BLANK[list](id)] })),
    id,
  };
}

export function updateItem<L extends ItemList>(
  config: SiteConfig,
  audience: Audience,
  list: L,
  id: string,
  patch: Partial<Omit<ItemOf<L>, 'id'>>,
): SiteConfig {
  return withAudience(config, audience, (a) => ({
    ...a,
    [list]: (a[list] as readonly ItemOf<L>[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

export function removeItem(config: SiteConfig, audience: Audience, list: ItemList, id: string): SiteConfig {
  return withAudience(config, audience, (a) => ({
    ...a,
    [list]: (a[list] as readonly { id: string }[]).filter((item) => item.id !== id),
  }));
}

export function moveItem(config: SiteConfig, audience: Audience, list: ItemList, id: string, offset: -1 | 1): SiteConfig {
  return withAudience(config, audience, (a) => {
    const items = a[list] as readonly { id: string }[];
    return { ...a, [list]: move(items, items.findIndex((i) => i.id === id), offset) };
  });
}

/* ---------- Revisión antes de publicar ---------- */

export interface ConfigIssue {
  readonly selection: Selection;
  readonly message: string;
}

/** Problemas que impiden publicar: etiquetas vacías, listas sin opciones, ids repetidos, URLs mal formadas. */
export function findIssues(config: SiteConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  for (const [audience, a] of Object.entries(config.audiences) as [Audience, AudienceConfig][]) {
    for (const s of a.sections) {
      if (!s.title.trim()) issues.push({ selection: { kind: 'section', audience, sectionId: s.id }, message: 'La sección no tiene título.' });
      const seen = new Set<string>();
      for (const f of s.fields) {
        const at: Selection = { kind: 'field', audience, sectionId: s.id, id: f.id };
        if (!f.label.trim()) issues.push({ selection: at, message: 'El campo no tiene etiqueta.' });
        if (seen.has(f.id)) issues.push({ selection: at, message: `La clave «${f.id}» está repetida en la sección.` });
        seen.add(f.id);
        if (hasOptions(f.type) && !(f.options ?? []).some((o) => o.label.trim())) {
          issues.push({ selection: at, message: `«${f.label}» necesita al menos una opción.` });
        }
        if (f.validation?.pattern) {
          try {
            new RegExp(f.validation.pattern);
          } catch {
            issues.push({ selection: at, message: `La validación de «${f.label}» no es una expresión válida.` });
          }
        }
      }
    }
    for (const d of a.documents) {
      const at: Selection = { kind: 'documents', audience, id: d.id };
      if (!d.name.trim()) issues.push({ selection: at, message: 'Un documento no tiene nombre.' });
      if (!d.formats.length) issues.push({ selection: at, message: `«${d.name}» no tiene formatos aceptados.` });
    }
    for (const al of a.alerts) {
      const at: Selection = { kind: 'alerts', audience, id: al.id };
      if (al.active && !al.message.trim()) issues.push({ selection: at, message: `El aviso «${al.title}» está activo y no tiene mensaje.` });
      if (al.startsOn && al.endsOn && al.endsOn < al.startsOn) {
        issues.push({ selection: at, message: `El aviso «${al.title}» termina antes de empezar.` });
      }
    }
    for (const c of a.channels) {
      const at: Selection = { kind: 'channels', audience, id: c.id };
      const isUrl = !['whatsapp', 'phone', 'email'].includes(c.kind);
      if (!c.value.trim()) issues.push({ selection: at, message: `«${c.label}» no tiene dato de contacto.` });
      else if (isUrl && !/^https:\/\/\S+\.\S+/.test(c.value)) {
        issues.push({ selection: at, message: `«${c.label}» tiene que ser un enlace que empiece con https://.` });
      } else if (c.kind === 'email' && !/^\S+@\S+\.\S+$/.test(c.value)) {
        issues.push({ selection: at, message: `«${c.label}» no es un correo válido.` });
      }
    }
  }
  return issues;
}
