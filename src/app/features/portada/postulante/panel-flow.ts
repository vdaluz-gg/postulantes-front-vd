import { ApplicationReceipt, ApplicationTarget, CandidateContact } from './candidacy.api';
import { JobSearchResult } from './job-search';
import { CompanyService, ProposalRow } from '../empresas/company-services';
import { TextPart } from '../portada.data';

/** Puesto por defecto cuando el postulante deja su CV sin elegir una oferta. */
export const SPONTANEOUS_POSITION = 'Postulación espontánea';

/** Qué muestra el recuadro de vista previa del panel en cada momento. */
export type PanelFlow =
  /** Vista previa del tema elegido (mapa, WhatsApp, seguimiento). */
  | { readonly kind: 'topic' }
  /** La IA está trabajando. */
  | { readonly kind: 'thinking'; readonly text: string }
  /** Algo no se pudo hacer; retry guarda la búsqueda para reintentarla. */
  | { readonly kind: 'notice'; readonly text: string; readonly retry: string }
  /** Ofertas encontradas para la consulta. */
  | { readonly kind: 'results'; readonly result: JobSearchResult }
  /** Pedido del CV, para el puesto indicado (y la oferta, si se eligió una). */
  | {
      readonly kind: 'cv';
      readonly position: string;
      readonly offerRef?: string;
      readonly error?: string;
    }
  /** Formulario de contacto, precargado por la IA o vacío. */
  | {
      readonly kind: 'form';
      readonly heading: string;
      readonly prefill: Partial<CandidateContact>;
      readonly typed: boolean;
      readonly target: ApplicationTarget;
      /** Por qué no se pudo enviar la postulación. */
      readonly error?: string;
    }
  /** Postulación enviada. */
  | {
      readonly kind: 'sent';
      readonly contact: CandidateContact;
      readonly receipt: ApplicationReceipt;
    }
  /** Respuesta de la IA en texto, con los datos clave en negrita. */
  | { readonly kind: 'say'; readonly parts: readonly TextPart[] }
  /** Empresas: servicio que recomienda la IA para la consulta. */
  | { readonly kind: 'recommend'; readonly query: string; readonly service: CompanyService }
  /** Empresas: propuesta que arma la IA. */
  | { readonly kind: 'proposal'; readonly rows: readonly ProposalRow[] }
  /** Empresas: propuesta enviada a un asesor. */
  | { readonly kind: 'proposal-sent'; readonly service: CompanyService }
  /** Colaboradores: accesos de Gestión Virtual. */
  | { readonly kind: 'shortcuts' }
  /** Colaboradores: descarga de la app. */
  | { readonly kind: 'app' };
