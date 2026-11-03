import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initials } from '../../../../core/models';

/**
 * Avatar con iniciales sobre el degradé del color de sección. md (44 px) en la barra superior,
 * lg (84 px) en el perfil. Como <button> o <a> necesita aria-label; como decoración, aria-hidden.
 */
@Component({
  selector: 'button[appAvatar], a[appAvatar], span[appAvatar]',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.lg]': 'size() === "lg"' },
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');

  protected readonly letters = computed(() => initials(this.name()));
}
