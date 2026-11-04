import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Marca temporal de los portales: cuadrado con el degradé del color de sección, "Grupo Gestión"
 * y, debajo, la pastilla del portal (POSTULANTES). Sin pastilla, solo marca y nombre.
 */
@Component({
  selector: 'app-brand',
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandComponent {
  readonly portal = input<string | null>(null);
  /** En pantallas muy angostas (≤ 380 px) deja solo el cuadrado. */
  readonly collapsible = input(false);
}
