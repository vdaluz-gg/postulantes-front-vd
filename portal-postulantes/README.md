# Portal de postulantes (separado)

Portal privado del postulante, apartado de la aplicación principal para llevarlo a un
repositorio propio o volver a integrarlo. No está conectado a la app: no tiene rutas, enlaces
ni providers activos en `src/`. Nada se eliminó; todo se movió con `git mv` (el historial se
conserva con `git log --follow`).

## Qué contiene

La carpeta replica la estructura de `src/`, así cada archivo vuelve a su lugar sin tocar imports.

| Área | Ruta | Contenido |
|---|---|---|
| Portal | `src/app/features/postulante/` | Rutas, guards de sesión, login, shell (barra lateral, barra superior, barra inferior en celular), Inicio, Mi perfil, vistas provisorias de las demás secciones, hojas (detalle de reunión, pedir otro horario), store, acciones y sesión del portal, componentes de dominio (stepper, reunión, postulación, lo próximo, hero). |
| Datos | `src/app/core/data-access/` | Contratos `AuthApi` y APIs del postulante, mocks, datos de ejemplo y `provideDataAccess()`. |
| Modelos | `src/app/core/models/` | Postulación, entrevista, documento, mensaje, perfil, oferta, apariencia y datos que entrega la portada. |
| Servicios | `src/app/core/services/` | `SessionService`, `SheetService`, `NotificationService`. |
| Utilidades | `src/app/core/utils/`, `src/app/core/theme/`, `src/app/shared/pipes/` | Fechas es-AR, eventos `.ics`, paleta para TypeScript, pipe `appDate`. |
| Átomos | `src/app/shared/ui/atoms/` | `button`, `chip`, `avatar`, `brand`, `icon-button`, `assistant-space`. |
| Moléculas | `src/app/shared/ui/molecules/` | `text-field`, `theme-switch`, `page-header`, `section-header`, `todo-item`, `tip`. |
| Organismos | `src/app/shared/ui/organisms/` | `side-sheet`, `notification-island`. |
| Estilos pendientes | `src/styles/pending/` | CSS de la maqueta para las secciones que faltan (calendario, mensajes, ofertas, perfil, asistente…), todavía sin componente. |
| Tests | `**/*.spec.ts` | 65 tests (login, shell, Inicio, hojas, store, guards, modelos, utilidades, UI). |

Archivos de soporte de esta carpeta: `tsconfig.json` (chequeo de tipos), `jest.config.cjs` y
`jest.resolver.cjs` (tests).

## Dependencias compartidas que quedan en la app principal

El portal las usa, pero también las usa la portada, así que siguen en `src/` sin cambios:

| Dependencia | Ruta en `src/` | Para qué la usa el portal |
|---|---|---|
| Ícono | `app/shared/ui/atoms/icon/` | Todos los íconos. |
| Sonidos | `app/core/services/sound.service.ts` | Clic, navegación, abrir/cerrar hojas, avisos, tilde. |
| Tema | `app/core/services/theme.service.ts` | Switch claro/oscuro. |
| Almacenamiento | `app/core/services/storage.service.ts` | Sesión (`gg_pses`) y claves compartidas (`STORAGE_KEYS`). |
| Movimiento | `app/core/services/motion.service.ts` | Respetar "Reducir movimiento". |
| Estilos globales | `styles/tokens.css`, `styles/base.css`, `styles/view-transitions.css` | Paleta y tokens por tema, alto contraste, `.skip`, animaciones base. |
| Configuración | `app/app.config.ts` | `provideRouter(..., withComponentInputBinding())` (las vistas reciben datos de la ruta como inputs), `provideHttpClient`, inicialización de tema y sonidos. |
| Tests | `setup-jest.ts`, dependencias `jest` y `jest-preset-angular` | Entorno de pruebas. |

El render 3D (`app/shared/three/`, `public/vendor/gg-holo.js`, `public/assets/models/`) es de la
portada y quedó en la app principal. El portal no lo usa: el asistente es por ahora un círculo.

## Verificar el portal sin moverlo

```bash
npm run test:portal
```

Corre el chequeo de tipos y los tests del portal. Los imports hacia las dependencias compartidas
se resuelven en `../src` (`rootDirs` en `tsconfig.json` y `jest.resolver.cjs`), así que no hace
falta copiarlas.

## Volver a integrarlo en esta app

1. Mover el contenido de vuelta, conservando el historial:
   ```bash
   git mv portal-postulantes/src/app/features/postulante src/app/features/postulante
   # y lo mismo con cada carpeta de portal-postulantes/src/ hacia src/
   ```
   La estructura es la misma, así que los imports quedan correctos.
2. `src/app/app.routes.ts`: agregar antes del comodín
   ```ts
   {
     path: 'postulante',
     loadChildren: () => import('./features/postulante/postulante.routes').then((m) => m.POSTULANTE_ROUTES),
   },
   ```
3. `src/app/app.config.ts`: agregar `provideDataAccess()` a los providers
   (`import { provideDataAccess } from './core/data-access/provide-data-access';`).
4. `src/app/app.ts` y `app.html`: importar `NotificationIslandComponent` y agregar
   `<app-notification-island />` debajo del `<router-outlet />`.
5. `src/app/features/portada/portada.data.ts`, perfil `post`: volver a poner los enlaces
   - `portalLink: '/postulante'`
   - acciones: "Ver todas las ofertas →" y "Dejar mi CV con IA" con `link: '/postulante'`
   - vista previa de WhatsApp: "Sí, postulame" y "Ver más ofertas" con `link: '/postulante/ofertas'`

   y actualizar en `portada.page.spec.ts` los tests que hoy esperan esos botones deshabilitados.
6. Borrar `tsconfig.json`, `jest.*.cjs`, este README y el script `test:portal` de `package.json`.
7. `npm test` y `npx ng build`.

## Llevarlo a un repositorio propio

1. Crear el proyecto: `npx @angular/cli@22 new portal-postulantes --style=css` (o copiar
   `angular.json`, `tsconfig*.json` y `package.json` de este repo).
2. Copiar `portal-postulantes/src/` sobre el `src/` del proyecto nuevo.
3. Copiar las dependencias compartidas de la tabla de arriba, en las mismas rutas.
4. En el proyecto nuevo, `app.routes.ts` puede montar el portal en la raíz:
   `{ path: '', loadChildren: () => import('./features/postulante/postulante.routes').then((m) => m.POSTULANTE_ROUTES) }`
   y los enlaces internos (`/postulante/...`) pasan a ser relativos a esa raíz.
5. `app.config.ts`: los mismos providers que la app principal más `provideDataAccess()`.
6. Tests: copiar `setup-jest.ts` y `jest.config.cjs` de la raíz e instalar
   `jest@30 jest-preset-angular@17 jest-environment-jsdom@30 @types/jest@30`.
7. Fuentes: el portal usa la tipografía del sistema (sin web-font).
8. Datos: hoy todo sale de mocks (`core/data-access/mock/`). Para el backend, implementar las
   clases abstractas de `core/data-access/*.api.ts` con `HttpClient` y cambiarlas en
   `provideDataAccess()`; componentes y store no se tocan.
