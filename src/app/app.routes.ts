import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Grupo Gestión · Bienvenido',
    loadComponent: () => import('./features/portada/portada.page').then((m) => m.PortadaPage),
  },
  { path: '**', redirectTo: '' },
];
