import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SheetService } from '../../../core/services/sheet.service';
import { SoundService } from '../../../core/services/sound.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PostulanteStore } from '../state/postulante.store';
import { NavBadge, PortalSection } from './portal-nav';
import { SideNavComponent } from './side-nav/side-nav.component';
import { TopBarComponent } from './top-bar/top-bar.component';

/**
 * Estructura del portal: navegación, barra superior y la vista actual. Al cambiar de vista
 * lleva la página arriba, pasa el foco al título (#h1) y suena "nav".
 */
@Component({
  selector: 'app-portal-shell',
  imports: [NgComponentOutlet, RouterOutlet, SideNavComponent, TopBarComponent],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  protected readonly store = inject(PostulanteStore);
  protected readonly sheets = inject(SheetService);
  private readonly portalSession = inject(PortalSessionService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  protected readonly badges = computed<Partial<Record<PortalSection, NavBadge | null>>>(() => {
    const active = this.store.activeApplications().length;
    const upcoming = this.store.upcomingInterviews().length;
    const offers = this.store.offers().length;
    const pending = this.store.unreadCount() + this.store.missingDocuments().length;
    return {
      postulaciones: active ? { count: active, tone: 'soft', label: `${active} en curso` } : null,
      calendario: upcoming ? { count: upcoming, tone: 'soft', label: `${upcoming} próximas` } : null,
      ofertas: { count: offers, tone: 'strong', label: `${offers} nuevas` },
      mensajes: pending ? { count: pending, tone: 'strong', label: `${pending} pendientes` } : null,
    };
  });

  constructor() {
    this.store.load();
    this.focusHeading();

    let previous = this.router.url;
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      if (e.urlAfterRedirects.split('?')[0] === previous.split('?')[0]) return;
      previous = e.urlAfterRedirects;
      this.sound.play('nav');
      this.doc.defaultView?.scrollTo(0, 0);
      this.focusHeading();
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.doc.getElementById('main')?.focus();
  }

  protected logout(): void {
    this.portalSession.logout();
  }

  private focusHeading(): void {
    afterNextRender(() => this.doc.getElementById('h1')?.focus({ preventScroll: true }), {
      injector: this.injector,
    });
  }
}
