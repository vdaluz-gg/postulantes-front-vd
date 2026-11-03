import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/session.guards';

const TITLE = 'Portal del postulante · Grupo Gestión';

export const POSTULANTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ingresar' },
  {
    path: 'ingresar',
    title: TITLE,
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'inicio',
    title: TITLE,
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
];
