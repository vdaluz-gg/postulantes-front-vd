import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../../../../shared/ui/atoms/avatar/avatar.component';
import { BrandComponent } from '../../../../shared/ui/atoms/brand/brand.component';
import { IconButtonComponent } from '../../../../shared/ui/atoms/icon-button/icon-button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { ThemeSwitchComponent } from '../../../../shared/ui/molecules/theme-switch/theme-switch.component';

/**
 * Barra superior del portal: switch de tema, accesibilidad, mensajes (con aviso de no leídos)
 * y avatar que lleva a "Mi perfil". En celular suma la marca a la izquierda.
 */
@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, AvatarComponent, BrandComponent, IconButtonComponent, IconComponent, ThemeSwitchComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  readonly name = input.required<string>();
  readonly unread = input(0);

  protected readonly messagesLabel = computed(() =>
    this.unread() ? `Mensajes: ${this.unread()} sin leer` : 'Mensajes',
  );
}
