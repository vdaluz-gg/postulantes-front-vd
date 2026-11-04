import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Interview } from '../../../../core/models';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ChipComponent } from '../../../../shared/ui/atoms/chip/chip.component';
import { INTERVIEW_STATUS_META } from '../interview-meta';

/** Fila de reunión: día grande, título, hora y postulación, y chip de estado. */
@Component({
  selector: 'button[appInterviewRow]',
  imports: [ChipComponent, DateFormatPipe],
  templateUrl: './interview-row.component.html',
  styleUrl: './interview-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button' },
})
export class InterviewRowComponent {
  readonly interview = input.required<Interview>();
  readonly applicationTitle = input('');

  protected readonly status = computed(() => INTERVIEW_STATUS_META[this.interview().status]);
}
