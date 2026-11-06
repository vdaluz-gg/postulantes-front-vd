import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { ApplicationTrackerComponent } from '../../../components/peek/application-tracker/application-tracker.component';
import { TrackerStep } from '../../../portada.data';

/** Confirmación de la postulación enviada y sus próximas etapas. */
@Component({
  selector: 'div[appApplicationSent]',
  imports: [IconComponent, ApplicationTrackerComponent],
  templateUrl: './application-sent.component.html',
  styleUrl: './application-sent.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationSentComponent {
  /** Nombre (sin apellido) para el saludo. */
  readonly firstName = input.required<string>();
  readonly position = input.required<string>();
  /** Código de seguimiento que asigna el backend. */
  readonly trackingCode = input<string | null>(null);

  protected readonly steps: readonly TrackerStep[] = [
    { label: 'Postulación recibida', when: 'Ahora', state: 'done' },
    { label: 'Datos revisados por la IA', when: 'Ahora', state: 'done' },
    { label: 'Entrevista', when: 'Te avisamos', state: 'now' },
    { label: 'Ingreso', when: 'A confirmar', state: 'next' },
  ];
}
