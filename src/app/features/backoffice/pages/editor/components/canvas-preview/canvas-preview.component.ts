import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input } from '@angular/core';
import { MotionService } from '../../../../../../core/services/motion.service';
import { EditorStore } from '../../../../data/editor.store';
import { AUDIENCE_LABEL } from '../../../../data/site-config.model';
import { Selection, sameSelection } from '../../../../data/site-config.ops';
import { AlertPreviewComponent } from '../alert-preview/alert-preview.component';
import { ChannelPreviewComponent } from '../channel-preview/channel-preview.component';
import { CopyPreviewComponent } from '../copy-preview/copy-preview.component';
import { DocumentPreviewComponent } from '../document-preview/document-preview.component';
import { PreviewDevice } from '../editor-toolbar/editor-toolbar.component';
import { FieldPreviewComponent } from '../field-preview/field-preview.component';

/**
 * Lienzo: el portal del público elegido con su color de sección. Cada aviso, texto, sección,
 * campo, documento y canal se selecciona con un clic. En modo limpio se ve como lo publicado:
 * sin elementos ocultos ni avisos apagados y sin marcas de selección.
 */
@Component({
  selector: 'app-canvas-preview',
  imports: [AlertPreviewComponent, ChannelPreviewComponent, CopyPreviewComponent, DocumentPreviewComponent, FieldPreviewComponent],
  templateUrl: './canvas-preview.component.html',
  styleUrl: './canvas-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasPreviewComponent {
  readonly device = input<PreviewDevice>('desktop');
  readonly clean = input(false);

  protected readonly store = inject(EditorStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  protected readonly audienceLabel = computed(() => AUDIENCE_LABEL[this.store.audience()]);
  protected readonly alerts = computed(() => (this.store.current()?.alerts ?? []).filter((a) => !this.clean() || a.active));
  protected readonly channels = computed(() => (this.store.current()?.channels ?? []).filter((c) => !this.clean() || c.visible));

  constructor() {
    // Lleva a la vista lo que se eligió desde el panel de capas o la revisión de problemas.
    afterRenderEffect(() => {
      this.store.selection();
      const selected = this.host.querySelector<HTMLElement>('[data-sel="true"]');
      selected?.scrollIntoView?.({ block: 'nearest', behavior: this.motion.reduced() ? 'auto' : 'smooth' });
    });
  }

  protected sel(selection: Selection): boolean {
    return !this.clean() && sameSelection(this.store.selection(), selection);
  }

  protected pick(selection: Selection, event?: Event): void {
    event?.stopPropagation();
    if (!this.clean()) this.store.select(selection);
  }
}
