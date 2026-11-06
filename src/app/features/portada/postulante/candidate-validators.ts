import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

/** Nombre o apellido: solo letras, espacios, apóstrofos y guiones (misma regla que el backend). */
export const nameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /^[\p{L}][\p{L}' -]*$/u.test(value) ? null : { name: 'invalidChars' };
};

/** Email con usuario, dominio y extensión de 2+ letras (misma regla que el backend). */
export const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
    ? null
    : { email: true };
};

/** DNI argentino: 7 u 8 dígitos (acepta puntos). */
export const dniValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^[\d.\s]+$/.test(raw)) return { dni: true };
  const n = digits(raw).length;
  return n === 7 || n === 8 ? null : { dni: true };
};

/**
 * Celular argentino para WhatsApp: 10 dígitos con código de área (11 5555-0142), con o sin
 * +54 9 adelante. Acepta espacios, guiones y paréntesis.
 */
export const whatsappValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^[+\d\s()-]+$/.test(raw)) return { whatsapp: true };
  const local = digits(raw).replace(/^549?/, '').replace(/^0/, '');
  return local.length === 10 ? null : { whatsapp: true };
};

/** Prefijos de CUIL de personas. */
const CUIL_PREFIXES = ['20', '23', '24', '27'];
const CUIL_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** CUIL de 11 números, con prefijo de persona y dígito verificador correcto (mismo cálculo que el backend). */
export function isValidCuil(value: string): boolean {
  const d = digits(value);
  if (d.length !== 11 || !CUIL_PREFIXES.includes(d.slice(0, 2))) return false;
  const sum = CUIL_WEIGHTS.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
  const check = 11 - (sum % 11);
  if (check === 10) return false;
  return (check === 11 ? 0 : check) === Number(d[10]);
}

/**
 * CUIL opcional: con o sin guiones. Si el DNI del formulario es válido, el CUIL tiene que
 * contenerlo (los 8 números del medio).
 */
export const cuilValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^[\d\s-]+$/.test(raw) || !isValidCuil(raw)) return { cuil: 'invalid' };
  const dni = control.parent?.get('dni');
  if (dni && !dni.errors && dni.value) {
    if (digits(raw).slice(2, 10) !== digits(dni.value).padStart(8, '0'))
      return { cuil: 'mismatch' };
  }
  return null;
};

/** Formatea un DNI con puntos de miles: 38412907 → 38.412.907. */
export function formatDni(value: string): string {
  const d = digits(value);
  return d ? Number(d).toLocaleString('es-AR') : '';
}

/** Formatea un CUIL con guiones: 27401234565 → 27-40123456-5. Si no tiene 11 números, lo deja igual. */
export function formatCuil(value: string): string {
  const d = digits(value);
  return d.length === 11 ? `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : value.trim();
}

/**
 * Separa un nombre completo en nombre y apellido cuando el dato llega junto (CVs viejos o
 * backends anteriores): 2 palabras → 1 + 1; 3 → 2 + 1; 4 o más → 2 + el resto.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { firstName: words[0] ?? '', lastName: '' };
  const cut = words.length === 2 ? 1 : 2;
  return { firstName: words.slice(0, cut).join(' '), lastName: words.slice(cut).join(' ') };
}
