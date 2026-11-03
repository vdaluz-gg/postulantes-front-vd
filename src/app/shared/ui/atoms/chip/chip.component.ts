import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipTone } from '../../../../core/models';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';

/**
 * Chip de estado o etiqueta. El estado nunca va solo por color: lleva ícono y texto.
 * <span appChip tone="ok" icon="check">Confirmada</span>
 */
@Component({
  selector: 'span[appChip]',
  imports: [IconComponent],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ok]': 'tone() === "ok"',
    '[class.warn]': 'tone() === "warn"',
    '[class.vio]': 'tone() === "vio"',
  },
})
export class ChipComponent {
  readonly tone = input<ChipTone>('');
  readonly icon = input<IconName | null>(null);
}
