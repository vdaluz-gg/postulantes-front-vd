import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { interviewTypeTone } from '../../../../core/models';
import { SheetService } from '../../../../core/services/sheet.service';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { ChipComponent } from '../../../../shared/ui/atoms/chip/chip.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { TipComponent } from '../../../../shared/ui/molecules/tip/tip.component';
import { SideSheetComponent } from '../../../../shared/ui/organisms/side-sheet/side-sheet.component';
import { INTERVIEW_STATUS_META, INTERVIEW_TYPE_META } from '../../components/interview-meta';
import { PortalActionsService } from '../../services/portal-actions.service';
import { PostulanteStore } from '../../state/postulante.store';
import { RescheduleSheetComponent } from '../reschedule-sheet/reschedule-sheet.component';

/** Detalle de una reunión: cuándo, con quién, dónde y qué se puede hacer con ella. */
@Component({
  selector: 'app-interview-sheet',
  imports: [SideSheetComponent, ButtonComponent, ChipComponent, IconComponent, TipComponent, DateFormatPipe],
  templateUrl: './interview-sheet.component.html',
  styleUrl: './interview-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewSheetComponent {
  readonly interviewId = input.required<string>();

  private readonly store = inject(PostulanteStore);
  private readonly actions = inject(PortalActionsService);
  private readonly sheet = inject(SheetService);

  protected readonly interview = computed(() => this.store.interview(this.interviewId()) ?? null);
  protected readonly application = computed(() => {
    const interview = this.interview();
    return interview ? (this.store.application(interview.applicationId) ?? null) : null;
  });
  protected readonly past = computed(() => this.interview()?.status === 'done');
  protected readonly type = computed(() => {
    const interview = this.interview();
    return interview ? INTERVIEW_TYPE_META[interview.type] : null;
  });
  protected readonly status = computed(() => {
    const interview = this.interview();
    return interview ? INTERVIEW_STATUS_META[interview.status] : null;
  });
  protected readonly typeTone = computed(() => {
    const interview = this.interview();
    return interview ? interviewTypeTone(interview) : '';
  });

  protected confirm(): void {
    const interview = this.interview();
    if (!interview) return;
    this.actions.confirm(interview);
    this.sheet.close();
  }

  protected join(): void {
    const interview = this.interview();
    if (interview) this.actions.join(interview);
  }

  protected startWithAgent(): void {
    this.sheet.close();
    this.actions.goToAgentRoom();
  }

  protected addToCalendar(): void {
    const interview = this.interview();
    if (interview) this.actions.addToCalendar(interview);
  }

  protected reschedule(): void {
    this.sheet.open(RescheduleSheetComponent, { interviewId: this.interviewId() });
  }
}
