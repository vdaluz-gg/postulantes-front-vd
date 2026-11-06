import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../../../core/api/api';
import { SoundService } from '../../../../core/services/sound.service';
import { ThemeToggleComponent } from '../../../../shared/ui/molecules/theme-toggle/theme-toggle.component';
import { DEMO_USERS } from '../../data/auth.api';
import { AuthStore } from '../../data/auth.store';
import { BoBrandComponent } from '../../ui/bo-brand/bo-brand.component';
import { BoButtonComponent } from '../../ui/bo-button/bo-button.component';
import { BoTextFieldComponent } from '../../ui/bo-text-field/bo-text-field.component';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ingreso con correo y contraseña. Hoy valida contra usuarios de prueba (MockAuthApi). */
@Component({
  selector: 'app-backoffice-login',
  imports: [BoBrandComponent, BoButtonComponent, BoTextFieldComponent, ThemeToggleComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  /** Ruta a la que volver después de ingresar (la deja el guard). */
  readonly volver = input<string>();

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly sound = inject(SoundService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');
  protected readonly formError = signal('');
  protected readonly busy = signal(false);

  protected submit(event?: Event): void {
    event?.preventDefault();
    if (this.busy()) return;
    const email = this.email().trim();
    this.emailError.set(!email ? 'Escribí tu correo.' : EMAIL.test(email) ? '' : 'Revisá el correo: falta la @ o el dominio.');
    this.passwordError.set(this.password() ? '' : 'Escribí tu contraseña.');
    this.formError.set('');
    if (this.emailError() || this.passwordError()) {
      this.focusFirstInvalid();
      return;
    }
    this.busy.set(true);
    this.auth.login(email, this.password()).subscribe({
      next: () => {
        this.sound.play('open');
        void this.router.navigateByUrl(this.safeReturn());
      },
      error: (e) => {
        this.busy.set(false);
        const message = errorMessage(e);
        this.formError.set(
          message === 'Credenciales inválidas' ? 'El correo o la contraseña no coinciden. Revisalos y probá de nuevo.' : message,
        );
      },
    });
  }

  /** Completa con el usuario de prueba de Marketing y entra. */
  protected useDemo(): void {
    const demo = DEMO_USERS[0];
    this.email.set(demo.email);
    this.password.set(demo.password);
    this.submit();
  }

  /** Solo rutas internas del backoffice, para no redirigir a otro sitio. */
  private safeReturn(): string {
    const target = this.volver() ?? '';
    return target.startsWith('/backoffice') && !target.startsWith('/backoffice/ingresar') ? target : '/backoffice';
  }

  private focusFirstInvalid(): void {
    setTimeout(() => this.host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }
}
