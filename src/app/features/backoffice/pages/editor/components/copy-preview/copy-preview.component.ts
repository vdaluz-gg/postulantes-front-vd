import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CopyConfig } from '../../../../data/site-config.model';

/** Texto del portal como un campo: nombre arriba y el texto en su caja, una línea por renglón. */
@Component({
  selector: 'app-copy-preview',
  templateUrl: './copy-preview.component.html',
  styleUrl: './copy-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyPreviewComponent {
  readonly copy = input.required<CopyConfig>();

  protected readonly lines = computed(() => this.copy().value.split('\n').filter((line) => line.trim()));
}
