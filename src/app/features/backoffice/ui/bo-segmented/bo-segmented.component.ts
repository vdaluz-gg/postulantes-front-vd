import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { BoOption } from '../bo-select-field/bo-select-field.component';

/** Control segmentado (una opción entre pocas): `[(value)]`. */
@Component({
  selector: 'bo-segmented',
  templateUrl: './bo-segmented.component.html',
  styleUrl: './bo-segmented.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'label()' },
})
export class BoSegmentedComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly BoOption[]>();
  readonly value = model('');
}
