import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { APPLICATION_STAGES, Application, StepState, stepState } from '../../../../core/models';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

const STATE_LABEL: Record<StepState, string> = {
  done: 'completada',
  now: 'actual',
  pend: 'pendiente',
  bad: 'sin avance',
};

/** Etapas de una postulación (4 pasos). El paso actual lleva aria-current="step". */
@Component({
  selector: 'ol[appStepper]',
  imports: [IconComponent],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-label': 'Etapas de la postulación' },
})
export class StepperComponent {
  readonly application = input.required<Application>();

  protected readonly steps = computed(() =>
    APPLICATION_STAGES.map((name, i) => {
      const state = stepState(this.application(), i);
      return { name, number: i + 1, state, label: STATE_LABEL[state] };
    }),
  );
}
