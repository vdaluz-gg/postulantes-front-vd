import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tema de un perfil ("Ofertas cerca de tu casa primero"). Botón de alternancia: el tema
 * elegido queda con aria-pressed="true" y su vista previa se muestra en el panel.
 */
@Component({
  selector: 'button[appTopicChip]',
  templateUrl: './topic-chip.component.html',
  styleUrl: './topic-chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', '[attr.aria-pressed]': 'pressed()' },
})
export class TopicChipComponent {
  readonly pressed = input(false);
}
