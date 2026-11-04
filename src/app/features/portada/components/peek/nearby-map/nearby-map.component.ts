import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MapPin, MapPoint } from '../../../portada.data';

/** Pasado este porcentaje del ancho, la etiqueta del punto va a la izquierda para no cortarse. */
const LABEL_FLIP_X = 60;
const PIN_STAGGER_S = 0.4;

/**
 * Mapa animado de ofertas cercanas: tu casa, las ofertas alrededor con su distancia y las rutas
 * punteadas que las unen. Las etiquetas quedan como lista para lectores de pantalla.
 */
@Component({
  selector: 'div[appNearbyMap]',
  templateUrl: './nearby-map.component.html',
  styleUrl: './nearby-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyMapComponent {
  readonly home = input.required<MapPoint>();
  readonly pins = input.required<readonly MapPin[]>();

  protected readonly routes = computed(() =>
    this.pins().map((p) => `M${this.home().x} ${this.home().y} L${p.x} ${p.y}`),
  );
  protected readonly placed = computed(() =>
    this.pins().map((p, i) => ({ ...p, flip: p.x > LABEL_FLIP_X, delay: `${i * PIN_STAGGER_S}s` })),
  );
}
