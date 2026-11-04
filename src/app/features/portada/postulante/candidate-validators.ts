import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

/** Nombre y apellido: al menos dos palabras, solo letras, espacios, apóstrofos y guiones. */
export const fullNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  if (!/^[\p{L}][\p{L}' -]*$/u.test(value)) return { fullName: 'invalidChars' };
  return value.split(/\s+/).length < 2 ? { fullName: 'missingLastName' } : null;
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
export const whatsappValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^[+\d\s()-]+$/.test(raw)) return { whatsapp: true };
  const local = digits(raw).replace(/^549?/, '').replace(/^0/, '');
  return local.length === 10 ? null : { whatsapp: true };
};

/** Formatea un DNI con puntos de miles: 38412907 → 38.412.907. */
export function formatDni(value: string): string {
  const d = digits(value);
  return d ? Number(d).toLocaleString('es-AR') : '';
}
