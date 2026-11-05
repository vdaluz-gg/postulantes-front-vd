import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EditorStore } from '../../../../data/editor.store';
import { AlertInspectorComponent } from '../alert-inspector/alert-inspector.component';
import { ChannelInspectorComponent } from '../channel-inspector/channel-inspector.component';
import { CopyInspectorComponent } from '../copy-inspector/copy-inspector.component';
import { DocumentInspectorComponent } from '../document-inspector/document-inspector.component';
import { FieldInspectorComponent } from '../field-inspector/field-inspector.component';
import { SectionInspectorComponent } from '../section-inspector/section-inspector.component';

/** Panel derecho: las propiedades de lo que está elegido, o una guía si no hay nada elegido. */
@Component({
  selector: 'app-inspector-panel',
  imports: [
    AlertInspectorComponent,
    ChannelInspectorComponent,
    CopyInspectorComponent,
    DocumentInspectorComponent,
    FieldInspectorComponent,
    SectionInspectorComponent,
  ],
  templateUrl: './inspector-panel.component.html',
  styleUrl: './inspector-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanelComponent {
  protected readonly store = inject(EditorStore);
}
