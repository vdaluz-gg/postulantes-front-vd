import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { TrackerStep, TrackerStepState } from '../../../portada.data';

const STATE_LABEL: Record<TrackerStepState, string> = {
  done: 'completado',
  now: 'en curso',
  next: 'pendiente',
};

/** Etapas de una postulación de ejemplo, que aparecen una tras otra. La actual late. */
@Component({
  selector: 'ol[appApplicationTracker]',
  imports: [IconComponent],
  templateUrl: './application-tracker.component.html',
  styleUrl: './application-tracker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-label': 'Etapas de la postulación' },
})
export class ApplicationTrackerComponent {
  readonly steps = input.required<readonly TrackerStep[]>();
  protected readonly stateLabel = STATE_LABEL;
}
