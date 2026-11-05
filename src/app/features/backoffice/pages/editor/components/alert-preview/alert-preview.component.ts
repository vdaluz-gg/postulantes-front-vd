import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';
import { AlertConfig } from '../../../../data/site-config.model';

/** Aviso como se ve arriba del portal, con su tono y botón. */
@Component({
  selector: 'app-alert-preview',
  imports: [IconComponent],
  templateUrl: './alert-preview.component.html',
  styleUrl: './alert-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"lvl-" + alert().level', '[class.off]': '!alert().active' },
})
export class AlertPreviewComponent {
  readonly alert = input.required<AlertConfig>();
}
