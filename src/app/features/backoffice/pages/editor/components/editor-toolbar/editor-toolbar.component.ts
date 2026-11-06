import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ThemeToggleComponent } from '../../../../../../shared/ui/molecules/theme-toggle/theme-toggle.component';
import { AuthStore } from '../../../../data/auth.store';
import { EditorStore } from '../../../../data/editor.store';
import { AUDIENCES, AUDIENCE_LABEL, Audience } from '../../../../data/site-config.model';
import { ConfigIssue } from '../../../../data/site-config.ops';
import { BoBrandComponent } from '../../../../ui/bo-brand/bo-brand.component';
import { IslandService } from '../../../../ui/bo-island/island.service';
import { BoSegmentedComponent } from '../../../../ui/bo-segmented/bo-segmented.component';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';

export type PreviewDevice = 'desktop' | 'mobile';

/**
 * Barra del editor: qué público se edita, deshacer y rehacer, estado del guardado, vista previa
 * (dispositivo y modo sin paneles), guardar borrador, publicar y salir.
 */
@Component({
  selector: 'app-editor-toolbar',
  imports: [
    IconComponent,
    MatButtonModule,
    BoBrandComponent,
    BoSegmentedComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbarComponent {
  readonly device = model<PreviewDevice>('desktop');
  /** Modo vista previa: oculta los paneles para ver el portal como lo ve la persona. */
  readonly previewOnly = model(false);

  protected readonly store = inject(EditorStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly island = inject(IslandService);

  protected readonly audiences = AUDIENCES.map((value) => ({
    value,
    label: AUDIENCE_LABEL[value],
    color: `var(--aud-${value})`,
  }));
  protected readonly admin = this.auth.admin;
  protected readonly initials = computed(() =>
    (this.admin()?.fullName ?? '')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join(''),
  );
  protected readonly menuOpen = signal(false);
  protected readonly issuesOpen = signal(false);

  protected readonly saveState = computed(() => {
    switch (this.store.status()) {
      case 'saving':
        return 'Guardando…';
      case 'publishing':
        return 'Publicando…';
      case 'error':
        return this.store.error();
      default: {
        if (this.store.dirty()) return 'Cambios sin guardar';
        const config = this.store.config();
        if (!config) return '';
        const when = new Date(config.updatedAt).toLocaleString('es-AR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        });
        return config.status === 'published'
          ? `Publicado · v${config.version} · ${when} h`
          : `Borrador guardado · v${config.version} · ${when} h`;
      }
    }
  });
  protected readonly busy = computed(
    () => this.store.status() === 'saving' || this.store.status() === 'publishing',
  );

  protected setAudience(value: string): void {
    this.store.setAudience(value as Audience);
  }

  protected save(): void {
    this.store.save(() =>
      this.island.show('Guardaste el borrador. Todavía no lo ven los portales.'),
    );
  }

  protected publish(): void {
    const ok = this.store.publish(() =>
      this.island.show('Publicaste los cambios. Ya los ven los portales.'),
    );
    if (!ok) {
      const n = this.store.issues().length;
      this.island.show(
        n === 1
          ? 'Hay 1 cosa para revisar antes de publicar.'
          : `Hay ${n} cosas para revisar antes de publicar.`,
        { tone: 'alert' },
      );
      this.issuesOpen.set(true);
    }
  }

  protected goTo(issue: ConfigIssue): void {
    this.issuesOpen.set(false);
    this.store.select(issue.selection);
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/backoffice/ingresar');
  }
}
