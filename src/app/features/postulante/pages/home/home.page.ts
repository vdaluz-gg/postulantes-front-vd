import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PostulanteStore } from '../../state/postulante.store';

/** Inicio del portal. El hero, lo próximo y los pendientes llegan en el siguiente paso. */
@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(PostulanteStore);
}
