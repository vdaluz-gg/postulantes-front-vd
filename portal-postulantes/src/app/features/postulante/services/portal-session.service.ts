import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { SheetService } from '../../../core/services/sheet.service';
import { PostulanteStore } from '../state/postulante.store';

/** Cierre de sesión del portal, compartido por la barra lateral y "Mi perfil" (celular). */
@Injectable({ providedIn: 'root' })
export class PortalSessionService {
  private readonly session = inject(SessionService);
  private readonly store = inject(PostulanteStore);
  private readonly sheets = inject(SheetService);
  private readonly router = inject(Router);

  logout(): void {
    this.sheets.close();
    this.session.end();
    this.store.reset();
    void this.router.navigate(['/postulante/ingresar']);
  }
}
