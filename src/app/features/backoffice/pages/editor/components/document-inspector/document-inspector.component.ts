import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocumentRequirement } from '../../../../data/site-config.model';
import { BoIconButtonComponent } from '../../../../ui/bo-icon-button/bo-icon-button.component';
import { BoSwitchComponent } from '../../../../ui/bo-switch/bo-switch.component';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { ItemInspectorBase } from '../item-inspector.base';
import { PropGroupComponent } from '../prop-group/prop-group.component';

/** Formatos que se pueden pedir. */
const FORMATS = ['pdf', 'jpg', 'png', 'doc', 'docx', 'xls', 'xlsx'] as const;
const MAX_MB = 25;

/** Documento que la persona tiene que subir: nombre, si es obligatorio, formatos, tamaño y vencimiento. */
@Component({
  selector: 'app-document-inspector',
  imports: [BoIconButtonComponent, BoSwitchComponent, BoTextFieldComponent, InspectorHeadComponent, PropGroupComponent],
  templateUrl: './document-inspector.component.html',
  styleUrl: '../item-inspector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentInspectorComponent extends ItemInspectorBase<'documents'> {
  protected readonly list = 'documents' as const;
  protected readonly formats = FORMATS;
  protected readonly maxMb = MAX_MB;

  protected name(item: DocumentRequirement): string {
    return item.name;
  }

  protected toggleFormat(format: string): void {
    const current = this.item()?.formats ?? [];
    const formats = current.includes(format) ? current.filter((f) => f !== format) : FORMATS.filter((f) => f === format || current.includes(f));
    this.set({ formats });
  }

  protected setSize(raw: string): void {
    const mb = Math.round(Number(raw));
    if (Number.isFinite(mb) && mb >= 1 && mb <= MAX_MB) this.set({ maxSizeMb: mb }, 'size');
  }
}
