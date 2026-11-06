import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { tap } from 'rxjs';

/**
 * Base de la API (postulantes-back-vd). Hoy el front usa datos simulados; al conectarla, cada
 * servicio cambia su implementación mock por la HTTP y todas las llamadas salen de esta base.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/api/v1',
});

/** Token de acceso del backoffice, para el interceptor. Lo provee la sesión. */
export const API_TOKEN = new InjectionToken<() => string | null>('API_TOKEN', {
  providedIn: 'root',
  factory: () => () => null,
});

/** Qué hacer cuando la API rechaza el token (401). Lo provee la sesión del backoffice. */
export const API_UNAUTHORIZED = new InjectionToken<() => void>('API_UNAUTHORIZED', {
  providedIn: 'root',
  factory: () => () => undefined,
});

/** Página de resultados, igual que la respuesta paginada del backend. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/** Formato de error del backend. `message` es una lista cuando falla la validación. */
export interface ApiError {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string | readonly string[];
  readonly path?: string;
  readonly timestamp?: string;
}

/** Primer mensaje legible de un error de la API o de la red. */
export function errorMessage(
  error: unknown,
  fallback = 'No pudimos completar la acción. Probá de nuevo.',
): string {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    return 'Hiciste muchos intentos seguidos. Esperá un minuto y probá de nuevo.';
  }
  const body =
    error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiError> | null)
      : (error as Partial<ApiError> | null);
  const message = body?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  if (typeof message === 'string' && message) return message;
  if (error instanceof HttpErrorResponse && error.status === 0)
    return 'No hay conexión con el servidor.';
  return fallback;
}

/** Agrega `Authorization: Bearer …` solo a los pedidos que van a la API, y avisa si el token ya no sirve. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(API_TOKEN)();
  if (!token || !req.url.startsWith(inject(API_BASE_URL))) return next(req);
  const unauthorized = inject(API_UNAUTHORIZED);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    tap({
      error: (e: unknown) => {
        if (e instanceof HttpErrorResponse && e.status === 401) unauthorized();
      },
    }),
  );
};
