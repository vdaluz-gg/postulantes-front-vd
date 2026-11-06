import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EditorStore } from '../../../../data/editor.store';
import {
  FIELD_TONES,
  FIELD_TONE_LABEL,
  FIELD_TYPES,
  FIELD_TYPE_LABEL,
  FieldConfig,
  FieldOption,
  FieldTone,
  FieldType,
  FieldValidation,
  hasOptions,
} from '../../../../data/site-config.model';
import { addField, duplicateField, findField, findSection, moveField, removeField, updateField } from '../../../../data/site-config.ops';
import { BoButtonComponent } from '../../../../ui/bo-button/bo-button.component';
import { BoIconButtonComponent } from '../../../../ui/bo-icon-button/bo-icon-button.component';
import { IslandService } from '../../../../ui/bo-island/island.service';
import { BoSelectFieldComponent } from '../../../../ui/bo-select-field/bo-select-field.component';
import { BoSwitchComponent } from '../../../../ui/bo-switch/bo-switch.component';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { OptionsEditorComponent } from '../options-editor/options-editor.component';
import { PropGroupComponent } from '../prop-group/prop-group.component';

const TEXT_TYPES: readonly FieldType[] = ['text', 'email', 'tel', 'textarea'];

/** Propiedades de un campo: textos, tipo, reglas, color, opciones y validación. */
@Component({
  selector: 'app-field-inspector',
  imports: [
    BoButtonComponent,
    BoIconButtonComponent,
    BoSelectFieldComponent,
    BoSwitchComponent,
    BoTextFieldComponent,
    InspectorHeadComponent,
    OptionsEditorComponent,
    PropGroupComponent,
  ],
  templateUrl: './field-inspector.component.html',
  styleUrl: './field-inspector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldInspectorComponent {
  readonly sectionId = input.required<string>();
  readonly fieldId = input.required<string>();

  private readonly store = inject(EditorStore);
  private readonly island = inject(IslandService);

  protected readonly typeOptions = FIELD_TYPES.map((value) => ({ value, label: FIELD_TYPE_LABEL[value] }));
  protected readonly tones = FIELD_TONES.map((value) => ({ value, label: FIELD_TONE_LABEL[value] }));
  /** El color «del portal» depende del público que se edita. */
  protected readonly audienceColor = computed(() => `var(--aud-${this.store.audience()})`);
  protected readonly patternHelp = 'Para el equipo técnico. Ej.: ^\\d{7,8}$ para un DNI.';

  protected readonly field = computed(() => {
    const config = this.store.config();
    return config ? findField(config, this.store.audience(), this.sectionId(), this.fieldId()) : undefined;
  });
  protected readonly sectionTitle = computed(() => {
    const config = this.store.config();
    return config ? (findSection(config, this.store.audience(), this.sectionId())?.title ?? '') : '';
  });
  protected readonly position = computed(() => {
    const section = findSection(this.store.config()!, this.store.audience(), this.sectionId());
    const index = section?.fields.findIndex((f) => f.id === this.fieldId()) ?? -1;
    return { first: index <= 0, last: !section || index === section.fields.length - 1 };
  });
  protected readonly withOptions = computed(() => hasOptions(this.field()?.type ?? 'text'));
  protected readonly isText = computed(() => TEXT_TYPES.includes(this.field()?.type ?? 'text'));
  protected readonly isNumber = computed(() => this.field()?.type === 'number');

  protected set(patch: Partial<Omit<FieldConfig, 'id'>>, key?: string): void {
    const audience = this.store.audience();
    this.store.apply(updateField(this.store.config()!, audience, this.sectionId(), this.fieldId(), patch), {
      key: key && `${audience}.${this.sectionId()}.${this.fieldId()}.${key}`,
    });
  }

  protected setType(type: string): void {
    this.set({ type: type as FieldType });
  }

  protected setTone(tone: FieldTone): void {
    this.set({ tone });
  }

  protected setOptions(change: { options: FieldOption[]; key: string }): void {
    this.set({ options: change.options }, change.key);
  }

  /** Cambia una regla de validación; un valor vacío la quita. */
  protected setRule(rule: keyof FieldValidation, raw: string): void {
    const numeric = rule !== 'pattern' && rule !== 'message';
    const value = raw.trim() === '' ? undefined : numeric ? Number(raw) : raw;
    if (numeric && value !== undefined && Number.isNaN(value)) return;
    const validation: Record<string, unknown> = { ...this.field()?.validation, [rule]: value };
    for (const k of Object.keys(validation)) if (validation[k] === undefined) delete validation[k];
    this.set({ validation: Object.keys(validation).length ? (validation as FieldValidation) : undefined }, `rule-${rule}`);
  }

  protected rule(rule: keyof FieldValidation): string {
    const value = this.field()?.validation?.[rule];
    return value === undefined ? '' : String(value);
  }

  protected move(offset: -1 | 1): void {
    this.store.apply(moveField(this.store.config()!, this.store.audience(), this.sectionId(), this.fieldId(), offset));
  }

  protected duplicate(): void {
    const audience = this.store.audience();
    const sectionId = this.sectionId();
    this.store.apply(duplicateField(this.store.config()!, audience, sectionId, this.fieldId()), {
      select: (id) => ({ kind: 'field', audience, sectionId, id }),
    });
  }

  protected addBelow(): void {
    const audience = this.store.audience();
    const sectionId = this.sectionId();
    this.store.apply(addField(this.store.config()!, audience, sectionId, this.fieldId()), {
      select: (id) => ({ kind: 'field', audience, sectionId, id }),
    });
  }

  protected remove(): void {
    const label = this.field()?.label ?? '';
    this.store.apply(removeField(this.store.config()!, this.store.audience(), this.sectionId(), this.fieldId()));
    this.store.select({ kind: 'section', audience: this.store.audience(), sectionId: this.sectionId() });
    this.island.show(`Borraste «${label}».`, { actionLabel: 'Deshacer', action: () => this.store.undo() });
  }
}
