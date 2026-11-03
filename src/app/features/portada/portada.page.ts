import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { AiPromptComponent } from './components/ai-prompt/ai-prompt.component';
import { BackTabComponent } from './components/back-tab/back-tab.component';
import { HomeButtonComponent } from './components/home-button/home-button.component';
import { FigureState, PersonaFigureComponent } from './components/persona-figure/persona-figure.component';
import { PersonaPanelComponent } from './components/persona-panel/persona-panel.component';
import { PortalButtonComponent } from './components/portal-button/portal-button.component';
import { SoundToggleComponent } from './components/sound-toggle/sound-toggle.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { PERSONAS, PersonaId, PersonaPrompt, personaForQuery } from './portada.data';

type RouteReply = 'idle' | 'thinking' | 'going';

/** Tiempos de la respuesta de la caja "Contale a la IA qué buscás y te llevo". */
const THINK_MS = 500;
const GO_MS = 650;

/**
 * Portada: elegir perfil (postulante, cliente, colaborador). Al elegir uno, la figura pasa
 * a la izquierda y se abre su panel de información a la derecha.
 */
@Component({
  selector: 'app-portada-page',
  imports: [
    RouterLink,
    IconComponent,
    AiPromptComponent,
    BackTabComponent,
    HomeButtonComponent,
    PersonaFigureComponent,
    PersonaPanelComponent,
    PortalButtonComponent,
    SoundToggleComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './portada.page.html',
  styleUrl: './portada.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class PortadaPage {
  protected readonly personas = PERSONAS;
  protected readonly routePrompt: PersonaPrompt = {
    label: 'Qué te trae por acá',
    placeholder: 'Contale a la IA qué buscás y te llevo',
    submit: 'Ir',
  };

  protected readonly hovered = signal<PersonaId | null>(null);
  protected readonly selectedId = signal<PersonaId | null>(null);
  protected readonly pendingQuery = signal('');
  protected readonly routeQuery = signal('');
  protected readonly reply = signal<RouteReply>('idle');
  protected readonly goingTo = signal('');

  protected readonly selected = computed(() => PERSONAS.find((p) => p.id === this.selectedId()) ?? null);
  protected readonly accent = computed(() => `var(--c-${this.selectedId() ?? this.hovered() ?? 'post'})`);

  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected figureState(id: PersonaId): FigureState {
    const selected = this.selectedId();
    if (selected) return selected === id ? 'selected' : 'away';
    return (this.hovered() ?? 'post') === id ? 'lit' : 'idle';
  }

  protected onHover(id: PersonaId, over: boolean): void {
    if (over) this.hovered.set(id);
    else if (this.hovered() === id) this.hovered.set(null);
  }

  protected select(id: PersonaId): void {
    this.selectedId.set(id);
  }

  protected close(): void {
    this.selectedId.set(null);
    this.pendingQuery.set('');
  }

  /** Interpreta la consulta, anuncia a qué perfil lleva y lo abre con la consulta precargada. */
  protected routeTo(query: string): void {
    const id = personaForQuery(query);
    const persona = PERSONAS.find((p) => p.id === id)!;
    this.reply.set('thinking');
    this.later(THINK_MS, () => {
      this.goingTo.set(persona.name);
      this.reply.set('going');
      this.hovered.set(id);
      this.later(GO_MS, () => {
        this.reply.set('idle');
        this.routeQuery.set('');
        this.pendingQuery.set(query);
        this.select(id);
      });
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
