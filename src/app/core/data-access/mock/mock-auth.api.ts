import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthApi, CodeRequestResult } from '../auth.api';

/** Acceso simulado: genera el código en el navegador y lo devuelve para mostrarlo. */
@Injectable()
export class MockAuthApi extends AuthApi {
  private readonly codes = new Map<string, string>();

  requestCode(email: string): Observable<CodeRequestResult> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.codes.set(email, code);
    return of({ devCode: code });
  }

  verifyCode(email: string, code: string): Observable<boolean> {
    return of(this.codes.get(email) === code);
  }
}
