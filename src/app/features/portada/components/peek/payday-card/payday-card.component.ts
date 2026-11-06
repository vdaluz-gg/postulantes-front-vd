import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nextPayday } from '../../../colaboradores/collaborator-data';

/** Próximo cobro del colaborador (ejemplo) y cuándo se acredita el aguinaldo. */
@Component({
  selector: 'div[appPaydayCard]',
  templateUrl: './payday-card.component.html',
  styleUrl: '../collaborator-cards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaydayCardComponent {
  protected readonly payday = nextPayday(new Date());
}
