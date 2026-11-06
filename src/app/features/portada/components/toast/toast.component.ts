import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** Muestra el aviso de ToastService. Queda siempre en el DOM para que el lector de pantalla lo anuncie. */
@Component({
  selector: 'p[appToast]',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-live': 'polite', '[class.on]': 'toast.visible()' },
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
