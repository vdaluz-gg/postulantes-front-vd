import { Observable } from 'rxjs';

export interface CodeRequestResult {
  /** Solo en el prototipo: el código se muestra en pantalla en lugar de enviarse por correo. */
  readonly devCode?: string;
}

/** Contrato del acceso sin contraseña. La implementación real llamará al backend. */
export abstract class AuthApi {
  /** Envía un código de 6 dígitos al correo indicado. */
  abstract requestCode(email: string): Observable<CodeRequestResult>;

  /** Verifica el código recibido por correo. */
  abstract verifyCode(email: string, code: string): Observable<boolean>;
}
