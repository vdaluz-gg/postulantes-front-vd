import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Espacio circular reservado para el asistente (hero, botón flotante, chat). Su contenido
 * (cabeza holográfica 3D) se monta aparte; mientras tanto queda el círculo del sistema de diseño.
 */
@Component({
  selector: 'span[appAssistantSpace]',
  templateUrl: './assistant-space.component.html',
  styleUrl: './assistant-space.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class AssistantSpaceComponent {}
