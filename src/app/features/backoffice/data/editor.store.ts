import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { errorMessage } from '../../../core/api/api';
import { AuthStore } from './auth.store';
import { SiteConfigApi } from './site-config.api';
import { Audience, SiteConfig } from './site-config.model';
import { Selection, findIssues } from './site-config.ops';

/** Cambios seguidos sobre el mismo dato (tipear una etiqueta) se juntan en un solo paso de historial. */
const COALESCE_MS = 900;
const HISTORY_LIMIT = 60;

export type EditorStatus = 'loading' | 'ready' | 'saving' | 'publishing' | 'error';

type Change = SiteConfig | { readonly config: SiteConfig; readonly id: string };

/**
 * Estado del editor: borrador en memoria, selección, historial para deshacer y rehacer, y
 * guardado o publicación a través de SiteConfigApi.
 */
@Injectable({ providedIn: 'root' })
export class EditorStore {
  private readonly api = inject(SiteConfigApi);
  private readonly auth = inject(AuthStore);

  private readonly past = signal<readonly SiteConfig[]>([]);
  private readonly future = signal<readonly SiteConfig[]>([]);
  private lastChange = { key: '', at: 0 };

  readonly config = signal<SiteConfig | null>(null);
  /** Última versión guardada o publicada, para saber si hay cambios sin guardar. */
  readonly saved = signal<SiteConfig | null>(null);
  readonly audience = signal<Audience>('postulantes');
  readonly selection = signal<Selection | null>(null);
  readonly status = signal<EditorStatus>('loading');
  readonly error = signal('');

  readonly dirty = computed(() => this.config() !== this.saved());
  readonly canUndo = computed(() => this.past().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);
  readonly issues = computed(() => {
    const config = this.config();
    return config ? findIssues(config) : [];
  });
  readonly current = computed(() => this.config()?.audiences[this.audience()] ?? null);

  load(): void {
    this.status.set('loading');
    this.api.load().subscribe({
      next: (config) => {
        this.config.set(config);
        this.saved.set(config);
        this.past.set([]);
        this.future.set([]);
        this.status.set('ready');
      },
      error: (e) => this.fail(e),
    });
  }

  /**
   * Aplica un cambio. Con `key`, los cambios seguidos sobre lo mismo se juntan; si el cambio
   * crea un elemento (`{config, id}`), lo selecciona con `select`.
   */
  apply(change: Change, options: { key?: string; select?: (id: string) => Selection } = {}): void {
    const before = this.config();
    if (!before) return;
    const next = 'audiences' in change ? change : change.config;
    if (next === before) return;
    const now = Date.now();
    const coalesce = !!options.key && options.key === this.lastChange.key && now - this.lastChange.at < COALESCE_MS;
    if (!coalesce) this.past.update((p) => [...p, before].slice(-HISTORY_LIMIT));
    this.lastChange = { key: options.key ?? '', at: now };
    this.future.set([]);
    this.config.set(next);
    if (options.select && !('audiences' in change)) this.selection.set(options.select(change.id));
  }

  undo(): void {
    const past = this.past();
    const current = this.config();
    if (!past.length || !current) return;
    this.future.update((f) => [current, ...f]);
    this.past.set(past.slice(0, -1));
    this.config.set(past[past.length - 1]);
    this.lastChange = { key: '', at: 0 };
    this.dropStaleSelection();
  }

  redo(): void {
    const [next, ...rest] = this.future();
    const current = this.config();
    if (!next || !current) return;
    this.past.update((p) => [...p, current]);
    this.future.set(rest);
    this.config.set(next);
    this.lastChange = { key: '', at: 0 };
    this.dropStaleSelection();
  }

  select(selection: Selection | null): void {
    if (selection) this.audience.set(selection.audience);
    this.selection.set(selection);
  }

  setAudience(audience: Audience): void {
    if (audience === this.audience()) return;
    this.audience.set(audience);
    this.selection.set(null);
  }

  save(onDone?: () => void): void {
    this.persist('saving', (config, author) => this.api.save(config, author), onDone);
  }

  /** Publica solo si no hay problemas pendientes. */
  publish(onDone?: () => void): boolean {
    if (this.issues().length) return false;
    this.persist('publishing', (config, author) => this.api.publish(config, author), onDone);
    return true;
  }

  private persist(
    status: 'saving' | 'publishing',
    call: (config: SiteConfig, author: string) => ReturnType<SiteConfigApi['save']>,
    onDone?: () => void,
  ): void {
    const config = this.config();
    if (!config) return;
    this.status.set(status);
    this.error.set('');
    call(config, this.auth.admin()?.fullName ?? 'Backoffice')
      .pipe(finalize(() => this.status() === status && this.status.set('ready')))
      .subscribe({
        next: (stored) => {
          // Si se siguió editando mientras guardaba, se conservan esos cambios.
          if (this.config() === config) this.config.set(stored);
          this.saved.set(this.config() === stored ? stored : config);
          onDone?.();
        },
        error: (e) => this.fail(e),
      });
  }

  private fail(error: unknown): void {
    this.error.set(errorMessage(error));
    this.status.set('error');
  }

  /** Tras deshacer, la selección puede apuntar a algo que ya no existe. */
  private dropStaleSelection(): void {
    const sel = this.selection();
    const config = this.config();
    if (!sel || !config) return;
    const a = config.audiences[sel.audience];
    const exists =
      sel.kind === 'section'
        ? a.sections.some((s) => s.id === sel.sectionId)
        : sel.kind === 'field'
          ? a.sections.some((s) => s.id === sel.sectionId && s.fields.some((f) => f.id === sel.id))
          : (a[sel.kind] as readonly { id: string }[]).some((i) => i.id === sel.id);
    if (!exists) this.selection.set(null);
  }
}
