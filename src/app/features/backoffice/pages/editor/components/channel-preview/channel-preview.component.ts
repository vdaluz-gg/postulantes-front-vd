import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../../../../../shared/ui/atoms/icon/icons';
import { ChannelConfig, ChannelKind } from '../../../../data/site-config.model';

const CHANNEL_ICON: Partial<Record<ChannelKind, IconName>> = {
  whatsapp: 'wa',
  phone: 'phone',
  email: 'mail',
  web: 'globe',
};

/** Canal o red social como píldora de contacto. */
@Component({
  selector: 'app-channel-preview',
  imports: [IconComponent],
  templateUrl: './channel-preview.component.html',
  styleUrl: './channel-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.off]': '!channel().visible' },
})
export class ChannelPreviewComponent {
  readonly channel = input.required<ChannelConfig>();

  protected readonly icon = computed<IconName>(() => CHANNEL_ICON[this.channel().kind] ?? 'link');
}
