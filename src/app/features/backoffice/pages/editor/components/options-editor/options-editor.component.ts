import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FieldOption } from '../../../../data/site-config.model';
import { uniqueId } from '../../../../data/site-config.ops';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';

/** Clave estable a partir del texto: "Fines de semana" → "fines-de-semana". */
const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'opcion';

/**
 * Lista editable de opciones: texto, orden, borrar y sumar. El valor que viaja a la API se
 * genera del texto al crear la opción y no cambia al corregirla.
 */
@Component({
  selector: 'app-options-editor',
  imports: [IconComponent, MatButtonModule],
  templateUrl: './options-editor.component.html',
  styleUrl: './options-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsEditorComponent {
  readonly options = input.required<readonly FieldOption[]>();
  readonly fieldLabel = input('');
  readonly changed = output<{ options: FieldOption[]; key: string }>();

  protected rename(index: number, label: string): void {
    this.emit(
      this.options().map((o, i) => (i === index ? { ...o, label } : o)),
      `option-${index}`,
    );
  }

  protected move(index: number, offset: -1 | 1): void {
    const next = [...this.options()];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    this.emit(next, 'options-order');
  }

  protected remove(index: number): void {
    this.emit(
      this.options().filter((_, i) => i !== index),
      'options-remove',
    );
  }

  protected add(): void {
    const label = `Opción ${this.options().length + 1}`;
    const value = uniqueId(slug(label), this.options().map((o) => o.value));
    this.emit([...this.options(), { value, label }], 'options-add');
  }

  private emit(options: FieldOption[], key: string): void {
    this.changed.emit({ options, key });
  }
}
