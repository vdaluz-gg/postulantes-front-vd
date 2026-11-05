import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';
import { DocumentRequirement } from '../../../../data/site-config.model';

/** Fila de documento para subir: nombre, formatos, tamaño, si es obligatorio y el botón. */
@Component({
  selector: 'app-document-preview',
  imports: [IconComponent],
  templateUrl: './document-preview.component.html',
  styleUrl: './document-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewComponent {
  readonly doc = input.required<DocumentRequirement>();

  protected readonly rules = computed(() => {
    const d = this.doc();
    const formats = d.formats.length ? d.formats.join(', ').toUpperCase() : 'Sin formatos';
    return `${formats} · hasta ${d.maxSizeMb} MB${d.expires ? ' · con vencimiento' : ''}`;
  });
}
