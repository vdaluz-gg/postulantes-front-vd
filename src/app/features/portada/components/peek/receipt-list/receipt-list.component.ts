import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { Receipt, latestReceipts } from '../../../colaboradores/collaborator-data';
import { PortadaButtonComponent } from '../../portada-button/portada-button.component';

/** Recibos de sueldo de ejemplo: el último se firma desde acá. */
@Component({
  selector: 'div[appReceiptList]',
  imports: [IconComponent, PortadaButtonComponent],
  templateUrl: './receipt-list.component.html',
  styleUrl: '../collaborator-cards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptListComponent {
  /** Recibos firmados en esta visita (los guarda el panel para no perderlos al cambiar de tema). */
  readonly signed = input<ReadonlySet<string>>(new Set());
  readonly sign = output<Receipt>();

  protected readonly receipts = latestReceipts(new Date());
}
