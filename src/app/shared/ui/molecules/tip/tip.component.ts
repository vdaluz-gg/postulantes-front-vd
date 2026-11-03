import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';

/** Bloque de explicación o consejo ("Por qué te la recomendamos", "Para llegar con tranquilidad"). */
@Component({
  selector: 'div[appTip]',
  imports: [IconComponent],
  templateUrl: './tip.component.html',
  styleUrl: './tip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipComponent {}
