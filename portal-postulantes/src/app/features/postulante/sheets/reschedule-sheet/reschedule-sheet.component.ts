import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { interviewerShortName } from '../../../../core/models';
import { NotificationService } from '../../../../core/services/notification.service';
import { SheetService } from '../../../../core/services/sheet.service';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { SideSheetComponent } from '../../../../shared/ui/organisms/side-sheet/side-sheet.component';
import { PostulanteStore } from '../../state/postulante.store';

/** Horarios alternativos que se ofrecen: [días después de la reunión, hora, minutos]. */
const ALTERNATIVES: readonly [number, number, number][] = [
  [1, 10, 0],
  [1, 15, 30],
  [2, 11, 30],
];

/** Pedido de otro horario: elegir entre tres alternativas y, si se quiere, contar el motivo. */
@Component({
  selector: 'app-reschedule-sheet',
  imports: [SideSheetComponent, ButtonComponent, DateFormatPipe],
  templateUrl: './reschedule-sheet.component.html',
  styleUrl: './reschedule-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescheduleSheetComponent {
  readonly interviewId = input.required<string>();

  private readonly store = inject(PostulanteStore);
  private readonly sheet = inject(SheetService);
  private readonly notifications = inject(NotificationService);

  protected readonly interview = computed(() => this.store.interview(this.interviewId()) ?? null);
  protected readonly slots = computed(() => {
    const base = this.interview()?.startsAt;
    if (!base) return [];
    return ALTERNATIVES.map(([days, h, m]) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      d.setHours(h, m, 0, 0);
      return d;
    });
  });
  protected readonly selected = linkedSignal(() => this.slots()[0]?.getTime() ?? 0);
  protected readonly reason = signal('');

  protected submit(): void {
    const interview = this.interview();
    if (!interview || !this.selected()) return;
    this.store.requestReschedule(interview.id, new Date(this.selected()), this.reason().trim());
    this.sheet.close();
    this.notifications.notify(`Pedido enviado a ${interviewerShortName(interview)}. Te respondemos por correo.`);
  }

  protected cancel(): void {
    this.sheet.dismiss();
  }

  protected onReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }
}
