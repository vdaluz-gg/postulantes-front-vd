import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ALERT_LEVELS, ALERT_LEVEL_LABEL, AlertConfig, AlertLevel } from '../../../../data/site-config.model';
import { BoSegmentedComponent } from '../../../../ui/bo-segmented/bo-segmented.component';
import { BoSwitchComponent } from '../../../../ui/bo-switch/bo-switch.component';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { ItemInspectorBase } from '../item-inspector.base';
import { PropGroupComponent } from '../prop-group/prop-group.component';
import { IconComponent } from '../../../../../../shared/ui/atoms/icon/icon.component';

/** Aviso que se muestra arriba del portal: tono, texto, botón opcional y fechas de vigencia. */
@Component({
  selector: 'app-alert-inspector',
  imports: [IconComponent, MatButtonModule, BoSegmentedComponent, BoSwitchComponent, BoTextFieldComponent, InspectorHeadComponent, PropGroupComponent],
  templateUrl: './alert-inspector.component.html',
  styleUrl: '../item-inspector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertInspectorComponent extends ItemInspectorBase<'alerts'> {
  protected readonly list = 'alerts' as const;
  protected readonly levels = ALERT_LEVELS.map((value) => ({ value, label: ALERT_LEVEL_LABEL[value] }));

  protected name(item: AlertConfig): string {
    return item.title;
  }

  protected setLevel(level: string): void {
    this.set({ level: level as AlertLevel });
  }

  /** Una fecha vacía quita el límite. */
  protected setDate(key: 'startsOn' | 'endsOn', value: string): void {
    this.set({ [key]: value || undefined });
  }
}
