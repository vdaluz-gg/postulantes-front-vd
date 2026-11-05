import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let nextId = 0;

/** Fila con texto y switch de ajuste (`role="switch"`): `[(checked)]`. */
@Component({
  selector: 'bo-switch',
  templateUrl: './bo-switch.component.html',
  styleUrl: './bo-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoSwitchComponent {
  readonly label = input.required<string>();
  readonly help = input('');
  readonly checked = model(false);

  readonly labelId = `bo-sw-${nextId++}`;

  protected toggle(): void {
    this.checked.update((on) => !on);
  }
}
