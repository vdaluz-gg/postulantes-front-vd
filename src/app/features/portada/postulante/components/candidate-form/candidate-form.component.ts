import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MotionService } from '../../../../../core/services/motion.service';
import { APPLICATION_SECTION, FieldConfig } from '../../../../backoffice/data/site-config.model';
import { SITE_CONFIG_SEED } from '../../../../backoffice/data/site-config.seed';
import { PortadaButtonComponent } from '../../../components/portada-button/portada-button.component';
import { AnswerValue, CandidateContact } from '../../candidacy.api';
import {
  cuilValidator,
  dniValidator,
  emailValidator,
  formatCuil,
  formatDni,
  nameValidator,
  whatsappValidator,
} from '../../candidate-validators';

/** Datos propios del formulario: viajan como datos del postulante; el resto son respuestas extra. */
type CoreName =
  'firstName' | 'lastName' | 'email' | 'dni' | 'cuil' | 'whatsapp' | 'zone' | 'position';

interface CoreMeta {
  readonly autocomplete: string;
  readonly inputmode?: string;
  readonly validators: ValidatorFn[];
  /** Siempre obligatorio y visible: sin este dato el backend no registra la postulación. */
  readonly locked?: boolean;
  readonly wide?: boolean;
  /** Mensajes por error: qué pasó y cómo seguir. */
  readonly messages: Readonly<Record<string, string>>;
}

const CORE: Readonly<Record<CoreName, CoreMeta>> = {
  firstName: {
    autocomplete: 'given-name',
    validators: [nameValidator, Validators.maxLength(80)],
    locked: true,
    messages: {
      required: 'Escribí tu nombre.',
      invalidChars: 'Usá solo letras en tu nombre.',
      maxlength: 'El nombre es demasiado largo.',
    },
  },
  lastName: {
    autocomplete: 'family-name',
    validators: [nameValidator, Validators.maxLength(80)],
    locked: true,
    messages: {
      required: 'Escribí tu apellido.',
      invalidChars: 'Usá solo letras en tu apellido.',
      maxlength: 'El apellido es demasiado largo.',
    },
  },
  cuil: {
    autocomplete: 'off',
    inputmode: 'numeric',
    validators: [cuilValidator],
    messages: {
      required: 'Escribí tu CUIL.',
      invalid: 'Revisá el CUIL: son 11 números, por ejemplo 20-12345678-6.',
      mismatch: 'El CUIL no coincide con tu DNI: revisá los dos.',
    },
  },
  dni: {
    autocomplete: 'off',
    inputmode: 'numeric',
    validators: [dniValidator],
    locked: true,
    messages: { required: 'Escribí tu DNI.', dni: 'Revisá el DNI: son 7 u 8 números.' },
  },
  email: {
    autocomplete: 'email',
    inputmode: 'email',
    validators: [emailValidator],
    locked: true,
    wide: true,
    messages: {
      required: 'Escribí tu email.',
      email: 'Revisá el email, por ejemplo nombre@ejemplo.com.',
    },
  },
  whatsapp: {
    autocomplete: 'tel',
    inputmode: 'tel',
    validators: [whatsappValidator],
    locked: true,
    messages: {
      required: 'Escribí tu celular.',
      whatsapp: 'Revisá el número: son 10 dígitos con el código de área, por ejemplo 11 5555-0142.',
    },
  },
  zone: {
    autocomplete: 'address-level2',
    validators: [Validators.minLength(2)],
    messages: {
      required: 'Contanos en qué zona vivís.',
      minlength: 'Escribí el nombre completo de tu zona.',
    },
  },
  position: {
    autocomplete: 'off',
    validators: [],
    wide: true,
    messages: { required: 'Escribí el puesto o dejá «Postulación espontánea».' },
  },
};

const isCore = (id: string): id is CoreName => id in CORE;

const SEED_FIELDS = SITE_CONFIG_SEED.audiences.postulantes.sections.find(
  (s) => s.id === APPLICATION_SECTION,
)!.fields;

/** Campo listo para mostrar: la configuración publicada más lo que agrega el formulario. */
export interface FormField {
  readonly config: FieldConfig;
  readonly core: boolean;
  readonly required: boolean;
  readonly visible: boolean;
  readonly wide: boolean;
  readonly autocomplete: string;
  readonly inputmode: string | null;
}

/** Arma la lista de campos: respeta orden, textos y reglas publicadas; los datos básicos no se pueden quitar. */
export function formFields(configs: readonly FieldConfig[]): FormField[] {
  // "fullName" es el campo de antes de separar nombre y apellido: ya no se muestra ni se envía.
  const list = configs.filter((f) => f.id !== 'fullName');
  for (const seed of SEED_FIELDS)
    if (!list.some((f) => f.id === seed.id))
      list.push({ ...seed, visible: seed.id === 'position' ? false : seed.visible });
  return list.map((config) => {
    const core = isCore(config.id) ? CORE[config.id] : null;
    const visible = !!core?.locked || config.visible;
    // Lo oculto nunca es obligatorio: la persona no podría completarlo.
    const required =
      !!core?.locked ||
      (visible && !config.readonly && (config.id === 'position' || config.required));
    return {
      config,
      core: !!core,
      required,
      visible,
      wide: core?.wide ?? (config.type === 'textarea' || config.type === 'chips'),
      autocomplete: core?.autocomplete ?? 'off',
      inputmode:
        core?.inputmode ??
        (config.type === 'number'
          ? 'decimal'
          : config.type === 'tel'
            ? 'tel'
            : config.type === 'email'
              ? 'email'
              : null),
    };
  });
}

type ControlValue = string | boolean | string[];

/** Las expresiones de formato las escribe el backoffice: si alguna no compila, no se aplica. */
function safePattern(pattern: string | undefined): ValidatorFn | null {
  if (!pattern) return null;
  try {
    new RegExp(pattern);
    return Validators.pattern(pattern);
  } catch {
    return null;
  }
}

function validatorsFor(field: FormField): ValidatorFn[] {
  const { config } = field;
  const rules = config.validation ?? {};
  const list: ValidatorFn[] = [];
  if (field.required)
    list.push(config.type === 'switch' ? Validators.requiredTrue : Validators.required);
  if (isCore(config.id)) return [...list, ...CORE[config.id].validators];
  if (config.type === 'email') list.push(emailValidator);
  if (rules.maxLength) list.push(Validators.maxLength(rules.maxLength));
  if (rules.min !== undefined) list.push(Validators.min(rules.min));
  if (rules.max !== undefined) list.push(Validators.max(rules.max));
  const pattern = safePattern(rules.pattern);
  if (pattern && config.type !== 'number') list.push(pattern);
  return list;
}

const emptyValue = (field: FormField): ControlValue =>
  field.config.type === 'chips' ? [] : field.config.type === 'switch' ? false : '';

/** Velocidad del tipeo de la IA (maqueta): 18 ms por letra y 120 ms entre campos. */
const TYPE_CHAR_MS = 18;
const TYPE_FIELD_MS = 120;

/**
 * Formulario de contacto del postulante, armado con los campos que publicó el backoffice (orden,
 * etiquetas, textos de ejemplo, ayudas, reglas y campos nuevos). Si llegan datos del CV, la IA los
 * escribe campo por campo; después la persona puede corregirlos. Valida al enviar y al salir de
 * cada campo.
 */
@Component({
  selector: 'app-candidate-form',
  imports: [ReactiveFormsModule, PortadaButtonComponent],
  templateUrl: './candidate-form.component.html',
  styleUrl: './candidate-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateFormComponent {
  /** Campos publicados del formulario de postulación. */
  readonly fieldConfigs = input<readonly FieldConfig[]>(SEED_FIELDS, { alias: 'fields' });
  /** Datos para precargar (los que leyó la IA o el puesto elegido). */
  readonly prefill = input<Partial<CandidateContact>>({});
  /** Escribir la precarga letra por letra. */
  readonly typed = input(false);
  /** Error del último envío (lo devuelve el servidor). */
  readonly failure = input('');
  readonly submitted = output<CandidateContact>();

  private readonly motion = inject(MotionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly fields = computed(() => formFields(this.fieldConfigs()));
  protected readonly shown = computed(() => this.fields().filter((f) => f.visible));
  /** Si cambian los campos publicados, se rearma el formulario conservando lo escrito. */
  protected readonly form = linkedSignal<
    FormField[],
    FormGroup<Record<string, FormControl<ControlValue>>>
  >({
    source: this.fields,
    computation: (fields, previous) =>
      new FormGroup(
        Object.fromEntries(
          fields.map((f) => [
            f.config.id,
            new FormControl<ControlValue>(
              previous?.value.controls[f.config.id]?.value ?? emptyValue(f),
              {
                nonNullable: true,
                validators: validatorsFor(f),
              },
            ),
          ]),
        ),
      ),
  });

  protected readonly typing = signal<string | null>(null);
  protected readonly filled = signal<ReadonlySet<string>>(new Set());
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

  protected control(id: string): AbstractControl<ControlValue> {
    return this.form().controls[id];
  }

  protected errorFor(field: FormField): string | null {
    const control = this.control(field.config.id);
    if (!control.errors || !(control.touched || this.attempted())) return null;
    const [key, detail] = Object.entries(control.errors)[0];
    const label = field.config.label;
    const custom = field.config.validation?.message?.trim();
    if (key === 'required')
      return isCore(field.config.id)
        ? CORE[field.config.id].messages['required']
        : `Completá «${label}».`;
    if (!isCore(field.config.id)) return custom || `Revisá «${label}».`;
    // En los datos básicos vale el mensaje del backoffice solo si lo cambiaron respecto del inicial.
    const seedMessage = SEED_FIELDS.find((f) => f.id === field.config.id)?.validation?.message;
    if (custom && custom !== seedMessage) return custom;
    const code = typeof detail === 'string' ? detail : key;
    return CORE[field.config.id].messages[code] ?? CORE[field.config.id].messages['required'];
  }

  protected describedBy(field: FormField): string | null {
    const ids = [
      field.config.help ? `cf-${field.config.id}-help` : '',
      this.errorFor(field) ? `cf-${field.config.id}-err` : '',
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  protected isPicked(id: string, value: string): boolean {
    const current = this.control(id).value;
    return Array.isArray(current) && current.includes(value);
  }

  protected toggleChip(id: string, value: string): void {
    const control = this.control(id);
    const current = Array.isArray(control.value) ? control.value : [];
    control.setValue(
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
    control.markAsTouched();
  }

  /** Al salir de un campo: DNI con puntos y CUIL con guiones. */
  protected onBlur(id: string): void {
    if (id === 'dni') this.formatDniOnBlur();
    if (id === 'cuil') this.formatCuilOnBlur();
  }

  private formatDniOnBlur(): void {
    const control = this.control('dni');
    if (control && !control.errors) control.setValue(formatDni(String(control.value)));
    // El CUIL se compara con el DNI: si cambió el DNI, se vuelve a revisar.
    this.control('cuil')?.updateValueAndValidity();
  }

  private formatCuilOnBlur(): void {
    const control = this.control('cuil');
    if (control && !control.errors && control.value) {
      control.setValue(formatCuil(String(control.value)));
    }
  }

  protected submit(): void {
    this.attempted.set(true);
    this.serverError.set('');
    const form = this.form();
    form.controls['cuil']?.updateValueAndValidity();
    form.markAllAsTouched();
    if (form.invalid) {
      const invalid = this.fields().filter((f) => form.controls[f.config.id].invalid);
      this.summary.set(
        invalid.length === 1 ? 'Revisá 1 campo.' : `Revisá ${invalid.length} campos.`,
      );
      this.host.querySelector<HTMLElement>(`#cf-${invalid[0].config.id}`)?.focus();
      return;
    }
    this.summary.set('');
    const value = form.getRawValue();
    const text = (id: CoreName) => String(value[id] ?? '').trim();
    const answers: Record<string, AnswerValue> = {};
    for (const f of this.fields()) {
      if (f.core || !f.visible || f.config.readonly) continue;
      const v = value[f.config.id];
      if (v === '' || (Array.isArray(v) && !v.length)) continue;
      answers[f.config.id] =
        f.config.type === 'number' ? Number(v) : typeof v === 'string' ? v.trim() : v;
    }
    this.submitted.emit({
      firstName: text('firstName'),
      lastName: text('lastName'),
      email: text('email').toLowerCase(),
      dni: formatDni(text('dni')),
      ...(text('cuil') && { cuil: formatCuil(text('cuil')) }),
      whatsapp: text('whatsapp'),
      zone: text('zone'),
      position: text('position'),
      ...(Object.keys(answers).length && { answers }),
    });
  }

  private load(data: Partial<CandidateContact>): void {
    const form = this.form();
    if (data.answers) form.patchValue(data.answers as Record<string, ControlValue>);
    const entries = this.fields()
      .filter((f) => f.core)
      .map((f) => [f.config.id, String(data[f.config.id as CoreName] ?? '')] as const)
      .filter(([, v]) => v);
    if (!this.typed() || this.motion.reduced()) {
      form.patchValue(Object.fromEntries(entries));
      this.filled.set(new Set(entries.map(([id]) => id)));
      return;
    }
    this.busy.set(true);
    let at = 0;
    for (const [id, text] of entries) {
      this.later(at, () => this.typing.set(id));
      for (let i = 1; i <= text.length; i++) {
        this.later(at + i * TYPE_CHAR_MS, () => form.controls[id].setValue(text.slice(0, i)));
      }
      at += text.length * TYPE_CHAR_MS + TYPE_FIELD_MS;
      this.later(at, () => this.filled.update((set) => new Set([...set, id])));
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
