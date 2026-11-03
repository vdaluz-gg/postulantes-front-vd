export type DocumentKind = 'dni' | 'cv' | 'cuil' | 'secondary-certificate' | 'criminal-record';

export interface CandidateDocument {
  readonly id: string;
  readonly kind: DocumentKind;
  readonly name: string;
  readonly required: boolean;
  readonly fileName: string | null;
  /** Motivo por el que se pide (qué búsquedas lo requieren). */
  readonly reason?: string;
}

/** Resultado del análisis con IA de un documento subido. */
export interface DocumentAnalysis {
  readonly fileName: string;
  /** Datos de perfil que la IA pudo extraer del documento. */
  readonly extracted: {
    readonly education?: string;
  };
}

export const isMissingRequired = (d: CandidateDocument): boolean => d.required && !d.fileName;
