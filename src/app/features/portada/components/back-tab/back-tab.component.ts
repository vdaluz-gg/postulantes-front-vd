import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

/** Pestaña en el borde izquierdo que se despliega con el destino al pasar el cursor. */
@Component({
  selector: 'button[appBackTab]',
  imports: [IconComponent],
  templateUrl: './back-tab.component.html',
  styleUrl: './back-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', '[attr.aria-label]': 'label()' },
})
export class BackTabComponent {
  readonly label = input('Volver al inicio');
}
