import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EditorStore } from '../../../../data/editor.store';
import { FieldInspectorComponent } from '../field-inspector/field-inspector.component';
import { SectionInspectorComponent } from '../section-inspector/section-inspector.component';

/** Panel derecho: las propiedades de lo que está elegido, o una guía si no hay nada elegido. */
@Component({
  selector: 'app-inspector-panel',
  imports: [FieldInspectorComponent, SectionInspectorComponent],
  templateUrl: './inspector-panel.component.html',
  styleUrl: './inspector-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanelComponent {
  protected readonly store = inject(EditorStore);
}
