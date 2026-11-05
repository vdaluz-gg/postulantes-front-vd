import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CopyConfig } from '../../../../data/site-config.model';
import { BoIconButtonComponent } from '../../../../ui/bo-icon-button/bo-icon-button.component';
import { BoSwitchComponent } from '../../../../ui/bo-switch/bo-switch.component';
import { BoTextFieldComponent } from '../../../../ui/bo-text-field/bo-text-field.component';
import { InspectorHeadComponent } from '../inspector-head/inspector-head.component';
import { ItemInspectorBase } from '../item-inspector.base';
import { PropGroupComponent } from '../prop-group/prop-group.component';

/** Texto visible del portal (título, bajada, sugerencias) y su nombre interno. */
@Component({
  selector: 'app-copy-inspector',
  imports: [BoIconButtonComponent, BoSwitchComponent, BoTextFieldComponent, InspectorHeadComponent, PropGroupComponent],
  templateUrl: './copy-inspector.component.html',
  styleUrl: '../item-inspector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyInspectorComponent extends ItemInspectorBase<'copy'> {
  protected readonly list = 'copy' as const;

  protected name(item: CopyConfig): string {
    return item.label;
  }
}
