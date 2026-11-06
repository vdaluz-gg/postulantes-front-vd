/**
 * Configuración que administra el backoffice: qué campos, documentos, avisos, canales y textos
 * ve cada público (postulantes, clientes y colaboradores).
 *
 * Contrato de la API (postulantes-back-vd):
 *   GET  /backoffice/site-config          → SiteConfig (borrador vigente)
 *   PUT  /backoffice/site-config          → SiteConfig (guarda el borrador, incrementa version)
 *   POST /backoffice/site-config/publish  → SiteConfig (status: 'published')
 *   GET  /site-config/:audience           → AudienceConfig publicada (público)
 * Claves en inglés y camelCase, como el resto del backend.
 */

export const AUDIENCES = ['postulantes', 'clientes', 'colaboradores'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'chips', 'switch'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/**
 * Color del campo. Se elige entre tokens del sistema de diseño (no colores libres) para que
 * cualquier combinación mantenga el contraste AA en los dos temas.
 */
export const FIELD_TONES = ['neutral', 'section', 'positive', 'alert'] as const;
export type FieldTone = (typeof FIELD_TONES)[number];

export interface FieldOption {
  readonly value: string;
  readonly label: string;
}

export interface FieldValidation {
  /** Expresión regular que tiene que cumplir el valor (sin barras). */
  readonly pattern?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly maxLength?: number;
  /** Mensaje de error en voseo: qué pasó y cómo seguir. */
  readonly message?: string;
}

export interface FieldConfig {
  /** Clave estable del dato (la que viaja a la API); no cambia al renombrar la etiqueta. */
  readonly id: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly visible: boolean;
  /** Se muestra pero la persona no lo puede cambiar (lo carga el sistema). */
  readonly readonly: boolean;
  readonly tone: FieldTone;
  readonly placeholder?: string;
  readonly help?: string;
  readonly options?: readonly FieldOption[];
  readonly validation?: FieldValidation;
}

/** Un formulario o bloque de datos de una pantalla (por ejemplo "Avisar una ausencia"). */
export interface FormSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Pantalla del portal donde aparece, para ubicarlo. */
  readonly screen: string;
  readonly fields: readonly FieldConfig[];
}

export interface DocumentRequirement {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  /** Extensiones aceptadas, en minúscula y sin punto. */
  readonly formats: readonly string[];
  readonly maxSizeMb: number;
  /** Pide fecha de vencimiento al cargarlo. */
  readonly expires: boolean;
  readonly help?: string;
}

export const ALERT_LEVELS = ['info', 'positive', 'warning'] as const;
export type AlertLevel = (typeof ALERT_LEVELS)[number];

export interface AlertConfig {
  readonly id: string;
  readonly level: AlertLevel;
  readonly title: string;
  readonly message: string;
  readonly active: boolean;
  /** Fechas ISO (AAAA-MM-DD); sin fecha, el aviso no vence. */
  readonly startsOn?: string;
  readonly endsOn?: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
}

export const CHANNEL_KINDS = ['whatsapp', 'phone', 'email', 'web', 'linkedin', 'instagram', 'facebook', 'youtube', 'x', 'tiktok'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

/** Canal de contacto o red social que se muestra en el portal. */
export interface ChannelConfig {
  readonly id: string;
  readonly kind: ChannelKind;
  readonly label: string;
  /** Número, correo o URL, según el tipo. */
  readonly value: string;
  readonly visible: boolean;
  /** Horario o aclaración: "Lun a vie · 9 a 17 h". */
  readonly note?: string;
}

/** Texto visible del portal (títulos, bajadas, sugerencias). */
export interface CopyConfig {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly multiline: boolean;
}

export interface AudienceConfig {
  readonly audience: Audience;
  readonly sections: readonly FormSection[];
  readonly documents: readonly DocumentRequirement[];
  readonly alerts: readonly AlertConfig[];
  readonly channels: readonly ChannelConfig[];
  readonly copy: readonly CopyConfig[];
}

export type ConfigStatus = 'draft' | 'published';

export interface SiteConfig {
  readonly version: number;
  readonly status: ConfigStatus;
  /** ISO 8601. */
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly audiences: Readonly<Record<Audience, AudienceConfig>>;
}

export const AUDIENCE_LABEL: Readonly<Record<Audience, string>> = {
  postulantes: 'Postulantes',
  clientes: 'Clientes',
  colaboradores: 'Colaboradores',
};

export const FIELD_TYPE_LABEL: Readonly<Record<FieldType, string>> = {
  text: 'Texto corto',
  email: 'Correo',
  tel: 'Teléfono',
  number: 'Número',
  date: 'Fecha',
  textarea: 'Texto largo',
  select: 'Lista desplegable',
  chips: 'Opciones en píldoras',
  switch: 'Sí / No',
};

export const FIELD_TONE_LABEL: Readonly<Record<FieldTone, string>> = {
  neutral: 'Neutro',
  section: 'Color del portal',
  positive: 'Positivo',
  alert: 'Alerta',
};

export const ALERT_LEVEL_LABEL: Readonly<Record<AlertLevel, string>> = {
  info: 'Informativo',
  positive: 'Positivo',
  warning: 'Atención',
};

export const CHANNEL_LABEL: Readonly<Record<ChannelKind, string>> = {
  whatsapp: 'WhatsApp',
  phone: 'Teléfono',
  email: 'Correo',
  web: 'Sitio web',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
  tiktok: 'TikTok',
};

/** Sección de postulantes con el formulario de postulación de la portada. */
export const APPLICATION_SECTION = 'application';

/**
 * Datos sin los que el backend no registra una postulación: no se pueden borrar, ocultar ni volver
 * opcionales (el backend rechaza publicar una configuración así).
 */
export const CORE_APPLICATION_FIELDS: readonly string[] = ['fullName', 'email', 'dni', 'whatsapp'];

/** Tipos que necesitan una lista de opciones. */
export const hasOptions = (type: FieldType): boolean => type === 'select' || type === 'chips';
