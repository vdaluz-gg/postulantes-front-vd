export type MessageChannel = 'email' | 'whatsapp';

export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: 'Correo',
  whatsapp: 'WhatsApp',
};

export interface InboxMessage {
  readonly id: string;
  readonly unread: boolean;
  readonly channel: MessageChannel;
  readonly from: string;
  readonly subject: string;
  readonly receivedAt: Date;
  /** Párrafos del cuerpo. Pueden incluir saltos de línea (<br>). */
  readonly body: readonly string[];
  /** Entrevista a la que refiere: habilita confirmar, reprogramar o unirse. */
  readonly interviewId?: string;
  /** Postulación a la que refiere: habilita la entrevista con el agente. */
  readonly applicationId?: string;
  /** El mensaje pide documentos: habilita ir a la pestaña de documentos. */
  readonly aboutDocuments?: boolean;
}

export type InboxTab = 'mensajes' | 'documentos';
