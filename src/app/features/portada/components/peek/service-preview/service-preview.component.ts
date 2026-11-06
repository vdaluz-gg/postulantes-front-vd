import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CompanyService } from '../../../empresas/company-services';

/** Ejemplo de cobertura de un pedido: 34 de 40 puestos cubiertos en 48 h. */
const SLOTS = Array.from({ length: 40 }, (_, i) => i < 34);
/** Embudo de una búsqueda de ejemplo: postulantes → entrevistas → terna → elegido. */
const FUNNEL = [
  { value: 120, width: 100 },
  { value: 24, width: 60 },
  { value: 5, width: 22 },
  { value: 1, width: 7 },
];
const DOCS = [
  { label: 'Recibo · Octubre', state: 'firmado' },
  { label: 'Liquidación · 1.ª quincena', state: 'lista' },
  { label: 'Alta · nuevo ingreso', state: 'cargada' },
];

/**
 * Servicio para empresas: una animación que lo explica (cobertura, embudo, ciclo, documentos o
 * línea de proceso), la descripción y lo que incluye. Las animaciones son decorativas y se
 * describen en texto.
 */
@Component({
  selector: 'div[appServicePreview]',
  templateUrl: './service-preview.component.html',
  styleUrl: './service-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicePreviewComponent {
  readonly service = input.required<CompanyService>();

  protected readonly slots = SLOTS;
  protected readonly funnel = FUNNEL;
  protected readonly docs = DOCS;
}
