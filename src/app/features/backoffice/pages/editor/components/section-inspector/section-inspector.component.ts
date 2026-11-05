import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EditorStore } from '../../../../data/editor.store';
import { FormSection } from '../../../../data/site-config.model';
import { addField, findSection, removeSection, updateSection } from '../../../../data/site-config.ops';
import { BoButtonComponent } from '../../../../ui/bo-button/bo-button.component';
import { BoIconButtonComponent } from '../../../../ui/bo-icon-button/bo-icon-button.component';
import { IslandService } from '../../../../ui/bo-island/island.service';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { PropGroupComponent } from '../prop-group/prop-group.component';

/** Propiedades de una sección de formulario: título, descripción, pantalla y sus campos. */
@Component({
  selector: 'app-section-inspector',
  imports: [BoButtonComponent, BoIconButtonComponent, BoTextFieldComponent, InspectorHeadComponent, PropGroupComponent],
  templateUrl: './section-inspector.component.html',
  styleUrl: './section-inspector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionInspectorComponent {
  readonly sectionId = input.required<string>();

  protected readonly store = inject(EditorStore);
  private readonly island = inject(IslandService);

  protected readonly section = computed(() => {
    const config = this.store.config();
    return config ? findSection(config, this.store.audience(), this.sectionId()) : undefined;
  });

  protected set(patch: Partial<Pick<FormSection, 'title' | 'description' | 'screen'>>, key: string): void {
    const audience = this.store.audience();
    this.store.apply(updateSection(this.store.config()!, audience, this.sectionId(), patch), { key: `${audience}.${this.sectionId()}.${key}` });
  }

  protected selectField(id: string): void {
    this.store.select({ kind: 'field', audience: this.store.audience(), sectionId: this.sectionId(), id });
  }

  protected addField(): void {
    const audience = this.store.audience();
    const sectionId = this.sectionId();
    this.store.apply(addField(this.store.config()!, audience, sectionId), { select: (id) => ({ kind: 'field', audience, sectionId, id }) });
  }

  protected remove(): void {
    const title = this.section()?.title ?? '';
    this.store.apply(removeSection(this.store.config()!, this.store.audience(), this.sectionId()));
    this.store.select(null);
    this.island.show(`Borraste la sección «${title}».`, { actionLabel: 'Deshacer', action: () => this.store.undo() });
  }
}
