import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Indicador de que la IA está trabajando: tres puntos que laten y un texto proyectado. */
@Component({
  selector: 'p[appAiThinking]',
  templateUrl: './ai-thinking.component.html',
  styleUrl: './ai-thinking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class AiThinkingComponent {}
