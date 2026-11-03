import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * El contenido depende del navegador (sesión en localStorage, fechas relativas, WebGL, audio),
 * por eso se renderiza en el cliente.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
