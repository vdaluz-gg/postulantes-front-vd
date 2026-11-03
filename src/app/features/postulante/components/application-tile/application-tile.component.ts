import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Application, applicationStatusTone } from '../../../../core/models';
import { ChipComponent } from '../../../../shared/ui/atoms/chip/chip.component';
import { StepperComponent } from '../stepper/stepper.component';

/** Tarjeta interna de una postulación en curso: puesto, referencia, etapas y estado. */
@Component({
  selector: 'button[appApplicationTile]',
  imports: [ChipComponent, StepperComponent],
  templateUrl: './application-tile.component.html',
  styleUrl: './application-tile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.aria-label]': '"Ver seguimiento de " + application().title + ". " + application().status',
  },
})
export class ApplicationTileComponent {
  readonly application = input.required<Application>();
  protected readonly tone = computed(() => applicationStatusTone(this.application()));
}
