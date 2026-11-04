import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Interview } from '../../../../core/models';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { AssistantSpaceComponent } from '../../../../shared/ui/atoms/assistant-space/assistant-space.component';
import { LeadSegment } from '../../pages/home/home.view-model';
import { NextInterviewComponent } from '../next-interview/next-interview.component';

/**
 * Hero del inicio: espacio del asistente, fecha, saludo con nombre, resumen con los datos
 * clave en negrita y, si hay, la próxima reunión.
 */
@Component({
  selector: 'section[appHomeHero]',
  imports: [AssistantSpaceComponent, NextInterviewComponent, DateFormatPipe],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-labelledby': 'h1' },
})
export class HomeHeroComponent {
  readonly today = input.required<Date>();
  readonly firstName = input.required<string>();
  readonly lead = input.required<readonly LeadSegment[]>();
  readonly next = input<Interview | null>(null);
  readonly nextTitle = input('');
  readonly now = input.required<number>();

  readonly join = output<Interview>();
  readonly details = output<Interview>();
}
