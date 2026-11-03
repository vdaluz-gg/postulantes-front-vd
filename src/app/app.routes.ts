import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'postulante' },
  {
    path: 'postulante',
    loadChildren: () => import('./features/postulante/postulante.routes').then((m) => m.POSTULANTE_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
