import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../../../../../shared/ui/atoms/icon/icons';
import { normalize } from '../../../../../../shared/utils/text';
import { EditorStore } from '../../../../data/editor.store';
import { ALERT_LEVEL_LABEL, AUDIENCE_LABEL, CHANNEL_LABEL, FieldType } from '../../../../data/site-config.model';
import { ItemList, Selection, addField, addItem, addSection, sameSelection } from '../../../../data/site-config.ops';

interface Layer {
  readonly selection: Selection;
  readonly label: string;
  readonly detail: string;
  readonly icon: IconName;
  readonly muted: boolean;
  readonly flag?: string;
}

interface LayerGroup {
  readonly id: string;
  readonly title: string;
  readonly section?: Selection;
  readonly add: { readonly label: string; readonly run: () => void };
  readonly layers: readonly Layer[];
}

const FIELD_ICON: Readonly<Record<FieldType, IconName>> = {
  text: 'text',
  email: 'mail',
  tel: 'phone',
  number: 'text',
  date: 'cal',
  textarea: 'form',
  select: 'chev',
  chips: 'layers',
  switch: 'check',
};

const CHANNEL_ICON: Partial<Record<string, IconName>> = { whatsapp: 'wa', phone: 'phone', email: 'mail' };

/**
 * Árbol de lo que ve el público elegido: secciones con sus campos, documentos, avisos, canales y
 * textos. Elegir una fila la selecciona en la vista previa y abre sus propiedades.
 */
@Component({
  selector: 'app-layers-panel',
  imports: [MatButtonModule, IconComponent],
  templateUrl: './layers-panel.component.html',
  styleUrl: './layers-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersPanelComponent {
  protected readonly store = inject(EditorStore);
  protected readonly query = signal('');
  protected readonly audienceLabel = computed(() => AUDIENCE_LABEL[this.store.audience()]);

  protected readonly groups = computed<LayerGroup[]>(() => {
    const a = this.store.current();
    if (!a) return [];
    const audience = a.audience;
    const words = normalize(this.query().trim());
    const match = (...texts: string[]) => !words || normalize(texts.join(' ')).includes(words);

    const sections: LayerGroup[] = a.sections.map((s) => ({
      id: `s-${s.id}`,
      title: s.title,
      section: { kind: 'section', audience, sectionId: s.id },
      add: {
        label: `Sumar un campo a «${s.title}»`,
        run: () =>
          this.store.apply(addField(this.store.config()!, audience, s.id), {
            select: (id) => ({ kind: 'field', audience, sectionId: s.id, id }),
          }),
      },
      layers: s.fields
        .filter((f) => match(f.label, f.id, s.title))
        .map((f) => ({
          selection: { kind: 'field', audience, sectionId: s.id, id: f.id },
          label: f.label || 'Sin etiqueta',
          detail: f.required ? 'Obligatorio' : '',
          icon: f.readonly ? 'lock' : FIELD_ICON[f.type],
          muted: !f.visible,
          flag: f.visible ? undefined : 'Oculto',
        })),
    }));

    const list = (id: ItemList, title: string, addLabel: string, layers: Layer[]): LayerGroup => ({
      id,
      title,
      add: { label: addLabel, run: () => this.addTo(id) },
      layers: layers.filter((l) => match(l.label, l.detail)),
    });

    return [
      ...sections.filter((g) => !words || g.layers.length || match(g.title)),
      list(
        'documents',
        'Documentos',
        'Sumar un documento',
        a.documents.map((d) => ({
          selection: { kind: 'documents', audience, id: d.id },
          label: d.name,
          detail: `${d.required ? 'Obligatorio' : 'Opcional'} · ${d.formats.join(', ').toUpperCase()}`,
          icon: 'file',
          muted: false,
        })),
      ),
      list(
        'alerts',
        'Avisos',
        'Sumar un aviso',
        a.alerts.map((al) => ({
          selection: { kind: 'alerts', audience, id: al.id },
          label: al.title,
          detail: ALERT_LEVEL_LABEL[al.level],
          icon: 'bell',
          muted: !al.active,
          flag: al.active ? undefined : 'Apagado',
        })),
      ),
      list(
        'channels',
        'Canales y redes',
        'Sumar un canal o red social',
        a.channels.map((c) => ({
          selection: { kind: 'channels', audience, id: c.id },
          label: c.label,
          detail: CHANNEL_LABEL[c.kind],
          icon: CHANNEL_ICON[c.kind] ?? 'link',
          muted: !c.visible,
          flag: c.visible ? undefined : 'Oculto',
        })),
      ),
      list(
        'copy',
        'Textos',
        'Sumar un texto',
        a.copy.map((c) => ({
          selection: { kind: 'copy', audience, id: c.id },
          label: c.label,
          detail: c.value.split('\n')[0] ?? '',
          icon: 'text',
          muted: false,
        })),
      ),
    ];
  });

  protected isSelected(selection: Selection): boolean {
    return sameSelection(this.store.selection(), selection);
  }

  protected addSection(): void {
    const audience = this.store.audience();
    this.store.apply(addSection(this.store.config()!, audience), {
      select: (sectionId) => ({ kind: 'section', audience, sectionId }),
    });
  }

  private addTo(list: ItemList): void {
    const audience = this.store.audience();
    this.store.apply(addItem(this.store.config()!, audience, list), { select: (id) => ({ kind: list, audience, id }) });
  }
}
