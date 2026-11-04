import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, input, output, viewChild } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { PortadaButtonComponent } from '../../../components/portada-button/portada-button.component';
import { JobPosting, formatDayMonth } from '../../job-offer';

/**
 * Detalle de una oferta para el postulante: rubro y referencia, zona, horario, fecha de
 * publicación, descripción, requisitos y beneficios. Al abrirse lleva el foco al título.
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
  protected readonly publishedOn = computed(() => formatDayMonth(this.job().publishedOn));

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus({ preventScroll: true }));
  }
}
