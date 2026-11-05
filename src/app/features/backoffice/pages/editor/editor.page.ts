import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { EditorStore } from '../../data/editor.store';
import { BoButtonComponent } from '../../ui/bo-button/bo-button.component';
import { BoSegmentedComponent } from '../../ui/bo-segmented/bo-segmented.component';
import { CanvasPreviewComponent } from './components/canvas-preview/canvas-preview.component';
import { EditorToolbarComponent, PreviewDevice } from './components/editor-toolbar/editor-toolbar.component';
import { InspectorPanelComponent } from './components/inspector-panel/inspector-panel.component';
import { LayersPanelComponent } from './components/layers-panel/layers-panel.component';

type Pane = 'layers' | 'canvas' | 'inspector';

/**
 * Editor del backoffice, como una herramienta de diseño: capas a la izquierda, el portal en el
 * centro y las propiedades de lo elegido a la derecha. En celular los tres paneles son pestañas.
 */
@Component({
  selector: 'app-backoffice-editor',
  imports: [BoButtonComponent, BoSegmentedComponent, CanvasPreviewComponent, EditorToolbarComponent, InspectorPanelComponent, LayersPanelComponent],
  templateUrl: './editor.page.html',
  styleUrl: './editor.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKey($event)',
    '(window:beforeunload)': 'onLeave($event)',
  },
})
export class EditorPage {
  protected readonly store = inject(EditorStore);

  protected readonly device = signal<PreviewDevice>('desktop');
  protected readonly previewOnly = signal(false);
  protected readonly pane = signal<Pane>('canvas');
  protected readonly panes = [
    { value: 'layers', label: 'Capas' },
    { value: 'canvas', label: 'Vista previa' },
    { value: 'inspector', label: 'Propiedades' },
  ];
  protected readonly ready = computed(() => this.store.config() !== null);

  constructor() {
    if (!this.store.config()) this.store.load();
    // En celular, al elegir algo se pasa a sus propiedades.
    let first = true;
    effect(() => {
      const selection = this.store.selection();
      if (first) {
        first = false;
        return;
      }
      if (selection) this.pane.set('inspector');
    });
  }

  protected setPane(value: string): void {
    this.pane.set(value as Pane);
  }

  /** Atajos: deshacer, rehacer, guardar y soltar la selección. */
  protected onKey(event: KeyboardEvent): void {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const typing = (event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]');
    if (mod && key === 's') {
      event.preventDefault();
      if (this.store.dirty()) this.store.save();
      return;
    }
    if (typing) return;
    if (mod && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.store.redo();
      else this.store.undo();
    } else if (mod && key === 'y') {
      event.preventDefault();
      this.store.redo();
    } else if (key === 'escape' && this.store.selection()) {
      this.store.select(null);
    }
  }

  /** Pide confirmación del navegador si hay cambios sin guardar. */
  protected onLeave(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) event.preventDefault();
  }
}
