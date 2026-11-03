import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SoundService } from '../../../../core/services/sound.service';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

/** Botón para activar o silenciar los sonidos de la interfaz y la voz del asistente. */
@Component({
  selector: 'button[appSoundToggle]',
  imports: [IconComponent],
  templateUrl: './sound-toggle.component.html',
  styleUrl: './sound-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'sound.enabled()',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'title()',
    '(click)': 'sound.toggle()',
  },
})
export class SoundToggleComponent {
  protected readonly sound = inject(SoundService);

  protected readonly label = computed(() =>
    this.sound.enabled() ? 'Silenciar sonidos y voz' : 'Activar sonidos y voz',
  );
  protected readonly title = computed(() => (this.sound.enabled() ? 'Sonido activado' : 'Sonido desactivado'));
}
