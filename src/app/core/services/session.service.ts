import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from './storage.service';

/** Sesión del postulante. El correo es la identidad: el acceso es sin contraseña, por código. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(StorageService);

  readonly email = signal(this.storage.get(STORAGE_KEYS.session) ?? '');
  private readonly active = signal(!!this.storage.get(STORAGE_KEYS.session));

  readonly authenticated = this.active.asReadonly();

  start(email: string): void {
    this.email.set(email);
    this.active.set(true);
    this.storage.set(STORAGE_KEYS.session, email);
  }

  end(): void {
    this.active.set(false);
    this.storage.remove(STORAGE_KEYS.session);
  }
}
