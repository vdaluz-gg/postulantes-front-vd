import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CV_ACCEPT, CV_MAX_BYTES } from '../../candidacy.api';

const VALID_EXTENSIONS = /\.(pdf|docx?)$/i;

/**
 * Carga del CV: tocar para elegir el archivo o arrastrarlo. Acepta PDF o Word de hasta 5 MB;
 * si no cumple, explica qué pasó. También permite completar los datos a mano.
 */
@Component({
  selector: 'div[appCvUpload]',
  templateUrl: './cv-upload.component.html',
  styleUrl: './cv-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvUploadComponent {
  /** Error al leer un CV anterior (lo informa quien procesa el archivo). */
  readonly failure = input('');
  readonly selected = output<File>();
  readonly manual = output<void>();

  protected readonly accept = CV_ACCEPT;
  protected readonly error = signal('');
  protected readonly dragging = signal(false);
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  protected choose(): void {
    this.picker().nativeElement.click();
  }

  protected onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.take(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.take(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  private take(file: File): void {
    if (!VALID_EXTENSIONS.test(file.name)) {
      this.error.set('Ese archivo no es un CV que podamos leer. Subilo en PDF o Word.');
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      this.error.set('El archivo pesa más de 5 MB. Probá con una versión más liviana.');
      return;
    }
    this.error.set('');
    this.selected.emit(file);
  }
}
