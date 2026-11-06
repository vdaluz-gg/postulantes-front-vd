import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  CHANNEL_KINDS,
  CHANNEL_LABEL,
  ChannelConfig,
  ChannelKind,
} from '../../../../data/site-config.model';
import { BoSelectFieldComponent } from '../../../../ui/bo-select-field/bo-select-field.component';
import { BoSwitchComponent } from '../../../../ui/bo-switch/bo-switch.component';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { ItemInspectorBase } from '../item-inspector.base';
import { PropGroupComponent } from '../prop-group/prop-group.component';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';

/** Qué se pide en "dato" según el tipo de canal. */
const VALUE_FIELD: Partial<
  Record<ChannelKind, { label: string; placeholder: string; type: 'tel' | 'email' | 'url' }>
> = {
  whatsapp: { label: 'Número de WhatsApp', placeholder: '+54 9 11 0000-0000', type: 'tel' },
  phone: { label: 'Teléfono', placeholder: '11 0000-0000', type: 'tel' },
  email: { label: 'Correo', placeholder: 'contacto@empresa.com', type: 'email' },
};
const URL_FIELD = { label: 'Enlace', placeholder: 'https://…', type: 'url' as const };

/** Canal de contacto o red social: tipo, nombre visible, dato, horario y si se muestra. */
@Component({
  selector: 'app-channel-inspector',
  imports: [
    IconComponent,
    MatButtonModule,
    BoSelectFieldComponent,
    BoSwitchComponent,
    BoTextFieldComponent,
    InspectorHeadComponent,
    PropGroupComponent,
  ],
  templateUrl: './channel-inspector.component.html',
  styleUrl: '../item-inspector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelInspectorComponent extends ItemInspectorBase<'channels'> {
  protected readonly list = 'channels' as const;
  protected readonly kinds = CHANNEL_KINDS.map((value) => ({ value, label: CHANNEL_LABEL[value] }));
  protected readonly valueField = computed(
    () => VALUE_FIELD[this.item()?.kind ?? 'web'] ?? URL_FIELD,
  );

  protected name(item: ChannelConfig): string {
    return item.label;
  }

  /** Si el nombre era el del tipo anterior, lo actualiza al nuevo ("Instagram" → "LinkedIn"). */
  protected setKind(raw: string): void {
    const item = this.item();
    if (!item) return;
    const kind = raw as ChannelKind;
    const label = item.label === CHANNEL_LABEL[item.kind] ? CHANNEL_LABEL[kind] : item.label;
    this.set({ kind, label });
  }
}
