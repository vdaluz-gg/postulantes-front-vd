import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Interview } from '../../../../core/models';
import { formatDate } from '../../../../core/utils/date-format';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { SectionHeaderComponent } from '../../../../shared/ui/molecules/section-header/section-header.component';
import { TodoItemComponent } from '../../../../shared/ui/molecules/todo-item/todo-item.component';
import { ApplicationTileComponent } from '../../components/application-tile/application-tile.component';
import { HomeHeroComponent } from '../../components/home-hero/home-hero.component';
import { InterviewRowComponent } from '../../components/interview-row/interview-row.component';
import { PortalActionsService } from '../../services/portal-actions.service';
import { PostulanteStore } from '../../state/postulante.store';
import { HomeTodo, TodoAction, buildLead } from './home.view-model';

/**
 * Inicio del postulante: qué tiene que hacer ahora y cuándo es su próxima entrevista.
 * Orden: resumen y lo próximo, pendientes, próximas reuniones y postulaciones en curso.
 */
@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    ButtonComponent,
    SectionHeaderComponent,
    TodoItemComponent,
    ApplicationTileComponent,
    HomeHeroComponent,
    InterviewRowComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(PostulanteStore);
  private readonly actions = inject(PortalActionsService);
  private readonly router = inject(Router);

  protected readonly today = computed(() => new Date(this.store.now()));
  protected readonly lead = computed(() =>
    buildLead(this.store.nextInterview(), this.store.missingDocuments(), this.store.now()),
  );
  protected readonly nextTitle = computed(() => this.titleOf(this.store.nextInterview()));
  protected readonly upcoming = computed(() => this.store.upcomingInterviews().slice(0, 3));

  protected readonly todos = computed<HomeTodo[]>(() => {
    const list: HomeTodo[] = [];
    const pending = this.store.pendingInterview();
    const missing = this.store.missingDocuments();
    const awaiting = this.store.applicationAwaitingAgent();
    const completeness = this.store.completeness();

    if (pending) {
      const app = this.store.application(pending.applicationId);
      list.push({
        id: 'confirm',
        icon: 'alert',
        heading: `Confirmá tu reunión del ${formatDate(pending.startsAt, 'weekday')} ${formatDate(pending.startsAt, 'time')} h`,
        detail: app ? `${app.title} · ${app.ref}` : '',
        actionLabel: 'Confirmar',
        completes: true,
      });
    }
    if (missing.length) {
      list.push({
        id: 'documents',
        icon: 'up',
        heading: `Subí ${missing.length} ${missing.length > 1 ? 'documentos' : 'documento'} que piden tus postulaciones`,
        detail: missing.map((d) => d.name).join(' y '),
        actionLabel: 'Subir',
        completes: false,
      });
    }
    if (awaiting) {
      list.push({
        id: 'agent',
        icon: 'bot',
        heading: 'Hacé tu entrevista con el agente de IA',
        detail: `${awaiting.title} · 10 minutos, cuando quieras`,
        actionLabel: 'Empezar',
        completes: false,
      });
    }
    if (completeness < 100) {
      list.push({
        id: 'profile',
        icon: 'user',
        heading: `Completá tu perfil (${completeness} %)`,
        detail: 'Con más datos, la IA mejora tu match en las ofertas',
        actionLabel: 'Completar',
        completes: false,
      });
    }
    return list;
  });

  protected titleOf(interview: Interview | null): string {
    return interview ? (this.store.application(interview.applicationId)?.title ?? '') : '';
  }

  protected runTodo(action: TodoAction): void {
    switch (action) {
      case 'confirm': {
        const pending = this.store.pendingInterview();
        if (pending) this.actions.confirm(pending);
        break;
      }
      case 'documents':
        void this.router.navigate(['/postulante/mensajes'], { queryParams: { tab: 'documentos' } });
        break;
      case 'agent':
        this.actions.goToAgentRoom();
        break;
      case 'profile':
        void this.router.navigate(['/postulante/perfil']);
        break;
    }
  }

  protected join(interview: Interview): void {
    this.actions.join(interview);
  }

  /** El detalle de una reunión vive en el calendario. */
  protected openInterview(): void {
    void this.router.navigate(['/postulante/calendario']);
  }

  protected openApplication(): void {
    void this.router.navigate(['/postulante/postulaciones']);
  }
}
