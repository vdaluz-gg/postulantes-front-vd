import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

let nextId = 0;

/** Grupo de propiedades con título. Con `collapsible` arranca cerrado y se abre con su título. */
@Component({
  selector: 'app-prop-group',
  templateUrl: './prop-group.component.html',
  styleUrl: './prop-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropGroupComponent {
  readonly legend = input.required<string>();
  readonly collapsible = input(false);

  protected readonly open = signal(false);
  protected readonly bodyId = `bo-pg-${nextId++}`;
}
