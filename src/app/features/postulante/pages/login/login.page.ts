import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../../core/data-access/auth.api';
import { EMAIL_PATTERN } from '../../../../core/models';
import { SessionService } from '../../../../core/services/session.service';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { TextFieldComponent } from '../../../../shared/ui/molecules/text-field/text-field.component';
import { ThemeSwitchComponent } from '../../../../shared/ui/molecules/theme-switch/theme-switch.component';

type LoginStep = 'email' | 'code';

const DEMO_EMAIL = 'camila.rojas@ejemplo.com';
const CODE_LENGTH = 6;

/** Acceso sin contraseña: el postulante ingresa su correo y luego el código que recibe. */
@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ButtonComponent, IconComponent, TextFieldComponent, ThemeSwitchComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthApi);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly field = viewChild(TextFieldComponent);

  protected readonly step = signal<LoginStep>('email');
  protected readonly email = signal(this.session.email());
  protected readonly code = signal('');
  protected readonly devCode = signal('');
  protected readonly error = signal('');

  protected readonly subtitle = computed(() =>
    this.step() === 'email'
      ? 'Seguí tus postulaciones y entrevistas en un solo lugar. Sin contraseña.'
      : `Te enviamos un código a ${this.email()}`,
  );

  constructor() {
    this.focusField();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.error.set('');
    if (this.step() === 'email') this.requestCode();
    else this.verifyCode();
  }

  protected onCodeChange(value: string): void {
    this.code.set(value);
    if (value.length === CODE_LENGTH) this.verifyCode();
  }

  protected fillCode(): void {
    this.code.set(this.devCode());
    this.verifyCode();
  }

  protected useOtherEmail(): void {
    this.step.set('email');
    this.error.set('');
    this.focusField();
  }

  protected enterWithDemo(): void {
    this.enter(this.email().trim() || DEMO_EMAIL);
  }

  private requestCode(): void {
    const email = this.email().trim();
    if (!EMAIL_PATTERN.test(email)) {
      this.error.set('Revisá el correo: tiene que ser algo como nombre@correo.com.');
      this.field()?.focus();
      return;
    }
    this.auth.requestCode(email).subscribe((result) => {
      this.email.set(email);
      this.devCode.set(result.devCode ?? '');
      this.code.set('');
      this.step.set('code');
      this.focusField();
    });
  }

  private verifyCode(): void {
    const code = this.code().replace(/\s/g, '');
    if (code.length < CODE_LENGTH) {
      this.error.set('El código tiene 6 dígitos.');
      this.field()?.focus();
      return;
    }
    this.auth.verifyCode(this.email(), code).subscribe((ok) => {
      if (ok) {
        this.enter(this.email());
      } else {
        this.error.set('Ese código no es el que te enviamos. Probá de nuevo.');
        this.field()?.focus();
      }
    });
  }

  private enter(email: string): void {
    this.session.start(email);
    void this.router.navigate(['/postulante/inicio']);
  }

  private focusField(): void {
    afterNextRender(() => this.field()?.focus(), { injector: this.injector });
  }
}
