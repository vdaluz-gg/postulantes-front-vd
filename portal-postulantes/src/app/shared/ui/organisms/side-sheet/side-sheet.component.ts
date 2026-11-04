import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { SheetService } from '../../../../core/services/sheet.service';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
import { IconComponent } from '../../atoms/icon/icon.component';

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex]:not([tabindex="-1"])';

/**
 * Hoja lateral modal (en celular, hoja inferior). El cuerpo es el contenido proyectado; las
 * acciones del pie se proyectan con el atributo sheet-action. Toma el foco al abrirse
 * ([data-autofocus] o el botón de cerrar) y lo mantiene adentro mientras está abierta.
 */
@Component({
  selector: 'app-side-sheet',
  imports: [IconButtonComponent, IconComponent],
  templateUrl: './side-sheet.component.html',
  styleUrl: './side-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'sheet.dismiss()' },
})
export class SideSheetComponent {
  readonly heading = input.required<string>();
  /** Sin acciones no se dibuja el pie. */
  readonly hasFooter = input(true);

  protected readonly sheet = inject(SheetService);
  protected readonly replaced = computed(() => this.sheet.current()?.replaced ?? false);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  constructor() {
    afterNextRender(() => {
      if (!this.replaced()) {
        Array.from(this.body().nativeElement.children).forEach((child, i) => {
          const el = child as HTMLElement;
          el.style.animation = 'rise .5s var(--ease) both';
          el.style.animationDelay = `${120 + i * 45}ms`;
        });
      }
      const panel = this.panel().nativeElement;
      (panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>('button'))?.focus();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.sheet.dismiss();
  }

  /** Trampa de foco: Tab y Shift+Tab giran dentro de la hoja. */
  protected trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const items = Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
