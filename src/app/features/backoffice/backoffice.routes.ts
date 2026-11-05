import { Routes } from '@angular/router';
import { backofficeAuthGuard } from './data/auth.store';

export const BACKOFFICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/backoffice-shell.component').then((m) => m.BackofficeShellComponent),
    children: [
      {
        path: 'ingresar',
        title: 'Backoffice · Ingresar',
        loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: '',
        title: 'Backoffice · Editor',
        canActivate: [backofficeAuthGuard],
        loadComponent: () => import('./pages/editor/editor.page').then((m) => m.EditorPage),
      },
    ],
  },
];
