import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/ui/molecules/page-header/page-header.component';

/**
 * Vista provisoria de una sección del portal (título y bajada definitivos de la maqueta).
 * Se reemplaza por la vista real de cada sección a medida que se construye.
 */
@Component({
  selector: 'app-section-page',
  imports: [PageHeaderComponent],
  templateUrl: './section.page.html',
  styleUrl: './section.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPage {
  readonly heading = input.required<string>();
  readonly lead = input('');
}
