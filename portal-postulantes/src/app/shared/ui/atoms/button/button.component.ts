import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

export type ButtonVariant = 'pri' | 'sec' | 'ghost';
export type ButtonSize = 'md' | 'sm';

/**
 * Botón del portal. Se aplica sobre <button> o <a> para conservar la semántica nativa:
 * <button appButton variant="pri">Enviar</button>
 * <a appButton variant="ghost" routerLink="/">Volver</a>
 */
@Component({
  selector: 'button[appButton], a[appButton]',
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pri]': 'variant() === "pri"',
    '[class.sec]': 'variant() === "sec"',
    '[class.ghost]': 'variant() === "ghost"',
    '[class.sm]': 'size() === "sm"',
    '[attr.type]': 'isButton ? type() : null',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('sec');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  protected readonly isButton = inject(ElementRef).nativeElement.tagName === 'BUTTON';
}
