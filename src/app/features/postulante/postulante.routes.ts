import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/session.guards';

const TITLE = 'Portal del postulante · Grupo Gestión';
const section = () => import('./pages/section/section.page').then((m) => m.SectionPage);

export const POSTULANTE_ROUTES: Routes = [
  {
    path: 'ingresar',
    title: TITLE,
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    title: TITLE,
    canActivate: [authGuard],
    loadComponent: () => import('./shell/portal-shell.component').then((m) => m.PortalShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
      {
        path: 'postulaciones',
        loadComponent: section,
        data: { heading: 'Tus postulaciones', lead: 'Seguí en qué etapa está cada una y qué te toca hacer a vos.' },
      },
      {
        path: 'calendario',
        loadComponent: section,
        data: { heading: 'Calendario', lead: 'Todas tus reuniones con el agente y con las selectoras, en un solo lugar.' },
      },
      {
        path: 'ofertas',
        loadComponent: section,
        data: {
          heading: 'Ofertas para mí',
          lead: 'La IA ordena las búsquedas abiertas según tu perfil, tu disponibilidad y la distancia desde tu localidad.',
        },
      },
      {
        path: 'mensajes',
        loadComponent: section,
        data: { heading: 'Mensajes y documentos', lead: 'Lo que te enviamos y lo que necesitamos de vos.' },
      },
      { path: 'perfil', loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
    ],
  },
];
