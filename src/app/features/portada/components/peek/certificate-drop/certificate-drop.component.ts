import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/** Fotos y PDF: los formatos en que llega un certificado. */
export const CERTIFICATE_ACCEPT = 'image/*,.pdf,application/pdf';

/**
 * Carga de un certificado: abre la cámara o los archivos (también se puede soltar el archivo
 * encima). La IA lo lee y lo carga; en la portada es un ejemplo y el archivo no se envía.
 */
@Component({
  selector: 'div[appCertificateDrop]',
  templateUrl: './certificate-drop.component.html',
  styleUrl: './certificate-drop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateDropComponent {
  readonly selected = output<File>();
  protected readonly accept = CERTIFICATE_ACCEPT;

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.selected.emit(file);
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selected.emit(file);
  }
}
