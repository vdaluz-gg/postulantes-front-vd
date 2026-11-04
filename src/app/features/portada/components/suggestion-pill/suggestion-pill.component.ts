import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Sugerencia de consulta (borde punteado). Al usarla queda resaltada mientras sea la consulta actual. */
@Component({
  selector: 'button[appSuggestionPill]',
  templateUrl: './suggestion-pill.component.html',
  styleUrl: './suggestion-pill.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', '[class.on]': 'active()' },
})
export class SuggestionPillComponent {
  readonly active = input(false);
}
