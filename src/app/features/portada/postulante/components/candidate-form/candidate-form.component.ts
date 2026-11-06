import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  linkedSignal,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MotionService } from '../../../../../core/services/motion.service';
import { PortadaButtonComponent } from '../../../components/portada-button/portada-button.component';
import { CandidateContact } from '../../candidacy.api';
import { dniValidator, emailValidator, formatDni, fullNameValidator, whatsappValidator } from '../../candidate-validators';

type FieldName = keyof CandidateContact;

interface FieldConfig {
  readonly name: FieldName;
  readonly label: string;
  readonly autocomplete: string;
  readonly inputmode?: string;
  readonly type?: string;
  readonly placeholder: string;
  /** Ocupa las dos columnas. */
  readonly wide?: boolean;
}

const FIELDS: readonly FieldConfig[] = [
  { name: 'fullName', label: 'Nombre y apellido', autocomplete: 'name', placeholder: 'Martina Rodríguez' },
  { name: 'dni', label: 'DNI', autocomplete: 'off', inputmode: 'numeric', placeholder: '38.412.907' },
  { name: 'email', label: 'Email', autocomplete: 'email', inputmode: 'email', type: 'email', placeholder: 'martina@ejemplo.com', wide: true },
  { name: 'whatsapp', label: 'WhatsApp', autocomplete: 'tel', inputmode: 'tel', type: 'tel', placeholder: '11 5555-0142' },
  { name: 'zone', label: 'Zona', autocomplete: 'address-level2', placeholder: 'Monte Grande' },
  { name: 'position', label: 'Puesto', autocomplete: 'off', placeholder: 'Postulación espontánea', wide: true },
];

/** Mensajes por campo y error: qué pasó y cómo seguir. */
const MESSAGES: Record<FieldName, Record<string, string>> = {
  fullName: {
    required: 'Escribí tu nombre y apellido.',
    invalidChars: 'Usá solo letras en tu nombre.',
    missingLastName: 'Sumá tu apellido.',
  },
  email: { required: 'Escribí tu email.', email: 'Revisá el email, por ejemplo martina@ejemplo.com.' },
  dni: { required: 'Escribí tu DNI.', dni: 'Revisá el DNI: son 7 u 8 números.' },
  whatsapp: {
    required: 'Escribí tu celular.',
    whatsapp: 'Revisá el número: son 10 dígitos con el código de área, por ejemplo 11 5555-0142.',
  },
  zone: { required: 'Contanos en qué zona vivís.', minlength: 'Escribí el nombre completo de tu zona.' },
  position: { required: 'Escribí el puesto o dejá «Postulación espontánea».' },
};

/** Velocidad del tipeo de la IA (maqueta): 18 ms por letra y 120 ms entre campos. */
const TYPE_CHAR_MS = 18;
const TYPE_FIELD_MS = 120;

/**
 * Formulario de contacto del postulante. Si llegan datos del CV, la IA los escribe campo por
 * campo; después la persona puede corregirlos. Valida al enviar y al salir de cada campo.
 */
@Component({
  selector: 'app-candidate-form',
  imports: [ReactiveFormsModule, PortadaButtonComponent],
  templateUrl: './candidate-form.component.html',
  styleUrl: './candidate-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateFormComponent {
  /** Datos para precargar (los que leyó la IA o el puesto elegido). */
  readonly prefill = input<Partial<CandidateContact>>({});
  /** Escribir la precarga letra por letra. */
  readonly typed = input(false);
  /** Error del último envío (lo devuelve el servidor). */
  readonly failure = input('');
  readonly submitted = output<CandidateContact>();

  private readonly motion = inject(MotionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly fields = FIELDS;
  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, fullNameValidator] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, emailValidator] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required, dniValidator] }),
    whatsapp: new FormControl('', { nonNullable: true, validators: [Validators.required, whatsappValidator] }),
    zone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    position: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly typing = signal<FieldName | null>(null);
  protected readonly filled = signal<ReadonlySet<FieldName>>(new Set());
  protected readonly busy = signal(false);
  protected readonly attempted = signal(false);
  protected readonly summary = signal('');
  /** Error del servidor; se borra al volver a enviar. */
  private readonly serverError = linkedSignal(() => this.failure());
  protected readonly message = computed(() => this.summary() || this.serverError());

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    afterNextRender(() => this.load(this.prefill()));
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected errorFor(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.errors || !(control.touched || this.attempted())) return null;
    const [key, detail] = Object.entries(control.errors)[0];
    const code = typeof detail === 'string' ? detail : key;
    return MESSAGES[name][code] ?? MESSAGES[name]['required'];
  }

  protected formatDniOnBlur(): void {
    const control = this.form.controls.dni;
    if (!control.errors) control.setValue(formatDni(control.value));
  }

  protected submit(): void {
    this.attempted.set(true);
    this.serverError.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const invalid = FIELDS.filter((f) => this.form.controls[f.name].invalid);
      this.summary.set(invalid.length === 1 ? 'Revisá 1 campo.' : `Revisá ${invalid.length} campos.`);
      this.host.querySelector<HTMLInputElement>(`#cf-${invalid[0].name}`)?.focus();
      return;
    }
    this.summary.set('');
    const value = this.form.getRawValue();
    this.submitted.emit({
      ...value,
      fullName: value.fullName.trim(),
      email: value.email.trim().toLowerCase(),
      dni: formatDni(value.dni),
    });
  }

  private load(data: Partial<CandidateContact>): void {
    const entries = FIELDS.map((f) => [f.name, data[f.name] ?? ''] as const).filter(([, v]) => v);
    if (!this.typed() || this.motion.reduced()) {
      this.form.patchValue(Object.fromEntries(entries));
      this.filled.set(new Set(entries.map(([name]) => name)));
      return;
    }
    this.busy.set(true);
    let at = 0;
    for (const [name, text] of entries) {
      this.later(at, () => this.typing.set(name));
      for (let i = 1; i <= text.length; i++) {
        this.later(at + i * TYPE_CHAR_MS, () => this.form.controls[name].setValue(text.slice(0, i)));
      }
      at += text.length * TYPE_CHAR_MS + TYPE_FIELD_MS;
      this.later(at, () => this.filled.update((set) => new Set([...set, name])));
    }
    this.later(at, () => {
      this.typing.set(null);
      this.busy.set(false);
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
