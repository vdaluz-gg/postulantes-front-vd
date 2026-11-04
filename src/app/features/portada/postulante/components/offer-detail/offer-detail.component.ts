import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, input, output, viewChild } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { PortadaButtonComponent } from '../../../components/portada-button/portada-button.component';
import { JobPosting, formatSalary } from '../../job-offer';

/**
 * Detalle de una oferta para el postulante: referencia, lugar y radio, vacantes, salario,
 * descripción, condiciones y requisitos. Al abrirse lleva el foco al título.
 */
@Component({
  selector: 'section[appOfferDetail]',
  imports: [IconComponent, PortadaButtonComponent],
  templateUrl: './offer-detail.component.html',
  styleUrl: './offer-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-labelledby]': 'headingId()' },
})
export class OfferDetailComponent {
  readonly job = input.required<JobPosting>();
  readonly apply = output<JobPosting>();
  readonly back = output<void>();

  protected readonly headingId = computed(() => `job-${this.job().ref}`);
  protected readonly salary = computed(() => formatSalary(this.job().salary));
  protected readonly vacancies = computed(() => {
    const n = this.job().vacancies;
    return n === 1 ? '1 vacante' : `${n} vacantes`;
  });
  protected readonly conditions = computed(() => {
    const j = this.job();
    return [`Contratación: ${j.hiring}`, `Rama: ${j.branch}`, `Categoría: ${j.category}`, `Convenio: ${j.agreement}`];
  });
  protected readonly requirements = computed(() => {
    const j = this.job();
    return [
      j.experienceRequired ? 'Experiencia previa obligatoria' : 'Sin experiencia obligatoria',
      j.medicalExamRequired ? 'Examen preocupacional' : 'Sin examen preocupacional',
      j.uniformRequired ? 'Indumentaria propia' : 'No hace falta indumentaria propia',
    ];
  });

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus({ preventScroll: true }));
  }
}
