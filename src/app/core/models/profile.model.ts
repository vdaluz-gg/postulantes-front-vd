export interface UniformSizes {
  readonly pants: string;
  readonly shirt: string;
  readonly shoes: string;
}

export interface CandidateProfile {
  readonly name: string;
  readonly phone: string;
  readonly location: string;
  readonly education: string;
  readonly availability: readonly string[];
  readonly mobility: readonly string[];
  readonly experience: string;
  readonly cvFileName: string;
  readonly sizes: UniformSizes;
}

export type ProfileListKey = 'availability' | 'mobility';

export const EDUCATION_LEVELS = [
  'Primario completo',
  'Secundario incompleto',
  'Secundario completo',
  'Terciario o universitario en curso',
  'Terciario o universitario completo',
] as const;

export const AVAILABILITY_OPTIONS = ['Mañana', 'Tarde', 'Noche', 'Fines de semana'] as const;

export const MOBILITY_OPTIONS = ['Transporte público', 'Vehículo propio', 'Moto o bici'] as const;

export const UNIFORM_SIZE_OPTIONS: Record<keyof UniformSizes, readonly string[]> = {
  pants: ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58'],
  shirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  shoes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
};

/** Porcentaje de perfil completo. El correo viene de la sesión. */
export function profileCompleteness(p: CandidateProfile, email: string): number {
  const checks = [
    p.name,
    email,
    p.phone,
    p.location,
    p.education,
    p.availability.length,
    p.mobility.length,
    p.experience.trim(),
    p.cvFileName,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

export const firstName = (name: string): string => name.split(' ')[0];
