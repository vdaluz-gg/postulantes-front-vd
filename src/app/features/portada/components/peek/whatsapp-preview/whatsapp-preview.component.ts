import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../../shared/ui/atoms/icon/icon.component';
import { PanelCommand, PersonaAction, TextPart } from '../../../portada.data';
import { PortadaButtonComponent } from '../../portada-button/portada-button.component';

/** Ejemplo del aviso que manda la IA por WhatsApp, con las respuestas rápidas que ofrece. */
@Component({
  selector: 'div[appWhatsappPreview]',
  imports: [RouterLink, IconComponent, PortadaButtonComponent],
  templateUrl: './whatsapp-preview.component.html',
  styleUrl: './whatsapp-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappPreviewComponent {
  readonly sender = input.required<string>();
  readonly message = input.required<readonly TextPart[]>();
  readonly actions = input<readonly PersonaAction[]>([]);
  /** Respuesta rápida que resuelve el panel (por ejemplo, postularse o ver ofertas). */
  readonly command = output<PanelCommand>();
}
