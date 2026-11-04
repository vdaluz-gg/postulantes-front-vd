import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

export type PortadaButtonVariant = 'pri' | 'sec';
/** md: acciones del panel · lg: acción principal de una vista · mini: acciones dentro de una vista previa. */
export type PortadaButtonSize = 'md' | 'lg' | 'mini';

/**
 * Botón de la portada (radio 12, tipografía de portada, color del perfil en --acc).
 * Se aplica sobre <button> o <a> para conservar la semántica nativa:
 * <a appPortadaButton variant="pri" routerLink="/postulante">Ver ofertas</a>
 */
@Component({
  selector: 'button[appPortadaButton], a[appPortadaButton]',
  templateUrl: './portada-button.component.html',
  styleUrl: './portada-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pri]': 'variant() === "pri"',
    '[class.lg]': 'size() === "lg"',
    '[class.mini]': 'size() === "mini"',
    '[attr.type]': 'isButton ? type() : null',
  },
})
export class PortadaButtonComponent {
  readonly variant = input<PortadaButtonVariant>('sec');
  readonly size = input<PortadaButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');

  protected readonly isButton = inject(ElementRef).nativeElement.tagName === 'BUTTON';
}
