import { JobPosting } from './job-offer';

export interface JobSearchResult {
  /** Consulta tal como la escribió la persona (vacía: todas las ofertas). */
  readonly query: string;
  readonly jobs: readonly JobPosting[];
  /** false cuando ninguna oferta coincide y se muestran todas. */
  readonly matched: boolean;
}

/** Palabras que no ayudan a encontrar el tipo de trabajo. */
const STOPWORDS = new Set(['algo', 'trabajo', 'empleo', 'cerca', 'busco', 'quiero', 'para', 'con', 'una', 'uno', 'del', 'las', 'los', 'que', 'por', 'mas']);

export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const terms = (query: string): string[] =>
  normalize(query)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

const searchableText = (job: JobPosting): string =>
  normalize([job.title, job.description, job.area, job.address, job.branch, job.category, job.hiring].join(' '));

/**
 * Ofertas relacionadas con la consulta: todas las que comparten alguna palabra con el puesto,
 * la descripción, el área, el lugar, la rama o la categoría, de más a menos coincidencias.
 * Sin consulta devuelve todas; sin coincidencias, también todas (matched: false).
 */
export function searchJobs(query: string, offers: readonly JobPosting[]): JobSearchResult {
  const trimmed = query.trim();
  const words = terms(trimmed);
  if (!words.length) return { query: trimmed, jobs: offers, matched: true };

  const hits = offers
    .map((job, order) => {
      const text = searchableText(job);
      return { job, order, score: words.filter((w) => text.includes(w)).length };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((hit) => hit.job);

  return hits.length ? { query: trimmed, jobs: hits, matched: true } : { query: trimmed, jobs: offers, matched: false };
}
