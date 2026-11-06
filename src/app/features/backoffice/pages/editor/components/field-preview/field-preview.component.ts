import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';
import { FieldConfig } from '../../../../data/site-config.model';

/**
 * Un campo como lo ve la persona en el portal (sin interacción): etiqueta, control según el tipo,
 * ayuda, obligatorio y color. Lo envuelve un botón del canvas para seleccionarlo.
 */
@Component({
  selector: 'app-field-preview',
  imports: [IconComponent],
  templateUrl: './field-preview.component.html',
  styleUrl: './field-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"tone-" + field().tone',
    '[class.wide]': 'wide()',
    '[class.hidden-field]': '!field().visible',
  },
})
export class FieldPreviewComponent {
  readonly field = input.required<FieldConfig>();

  /** Ocupa el ancho completo de la grilla: textos largos, píldoras y switches. */
  protected readonly wide = computed(() =>
    ['textarea', 'chips', 'switch'].includes(this.field().type),
  );
  protected readonly selectText = computed(
    () => this.field().placeholder || this.field().options?.[0]?.label || 'Elegí una opción',
  );
}
