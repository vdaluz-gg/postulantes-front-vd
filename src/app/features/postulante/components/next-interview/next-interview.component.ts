import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Interview, interviewTypeTone } from '../../../../core/models';
import { countdown } from '../../../../core/utils/date-format';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { ChipComponent } from '../../../../shared/ui/atoms/chip/chip.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { INTERVIEW_TYPE_META } from '../interview-meta';

/** Bloque "lo próximo" del inicio: hora grande, tipo, título, detalle y acciones. */
@Component({
  selector: 'div[appNextInterview]',
  imports: [ButtonComponent, ChipComponent, IconComponent, DateFormatPipe],
  templateUrl: './next-interview.component.html',
  styleUrl: './next-interview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextInterviewComponent {
  readonly interview = input.required<Interview>();
  readonly applicationTitle = input('');
  readonly now = input.required<number>();

  readonly join = output<void>();
  readonly details = output<void>();

  protected readonly type = computed(() => INTERVIEW_TYPE_META[this.interview().type]);
  protected readonly tone = computed(() => interviewTypeTone(this.interview()));
  protected readonly remaining = computed(() => countdown(this.interview().startsAt, this.now()));
}
