import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let nextId = 0;

export interface BoOption {
  readonly value: string;
  readonly label: string;
  /** Color que identifica la opción (punto y subrayado en el control segmentado). */
  readonly color?: string;
}

/** Lista desplegable nativa con etiqueta: `[(value)]`. */
@Component({
  selector: 'bo-select-field',
  templateUrl: './bo-select-field.component.html',
  styleUrl: './bo-select-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()' },
})
export class BoSelectFieldComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly BoOption[]>();
  readonly value = model('');
  readonly help = input('');
  readonly compact = input(false);

  readonly selectId = `bo-sel-${nextId++}`;

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
