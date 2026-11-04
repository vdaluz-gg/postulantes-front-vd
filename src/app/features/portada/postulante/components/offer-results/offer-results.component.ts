import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { JobPosting } from '../../job-offer';
import { JobSearchResult } from '../../job-search';

/** Resultado de una búsqueda: resumen de la IA y la lista de ofertas para abrir su detalle. */
@Component({
  selector: 'div[appOfferResults]',
  imports: [IconComponent],
  templateUrl: './offer-results.component.html',
  styleUrl: './offer-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferResultsComponent {
  readonly result = input.required<JobSearchResult>();
  readonly open = output<JobPosting>();

  protected readonly count = computed(() => {
    const n = this.result().jobs.length;
    return n === 1 ? 'una oferta' : `${n} ofertas`;
  });
}
