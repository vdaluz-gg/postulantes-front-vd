# Grupo Gestión · Front

Front de Grupo Gestión en Angular 22: componentes standalone, signals y sin zone.js. Sigue el sistema de diseño de los portales (skill `grupo-gestion-ui`).

Tiene dos partes:

- **Portada**: los postulantes, clientes y colaboradores eligen su perfil.
- **Backoffice**: el equipo administra lo que esos tres públicos ven y completan.

Las ofertas y la postulación (datos y CV) ya usan la API de [`postulantes-back-vd`](#conexión-con-el-backend).
El ingreso y la configuración del backoffice siguen simulados. Cada servicio cambia de simulado a HTTP sin tocar pantallas.

---

## Arrancar

Requisitos: Node 20 o superior (recomendado 22) y npm.

```bash
npm install
npm start            # http://localhost:4200
```

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga. |
| `npx ng build` | Build de producción en `dist/`. Falla si un CSS de componente pasa el presupuesto. |
| `npm test` | Chequeo de tipos (app y tests) y después todos los tests de Jest. |
| `npm run typecheck` | Solo el chequeo de tipos. |
| `npx jest ruta/al.spec.ts` | Un archivo de tests. |
| `npm run smoke:firefox` | Prueba de humo en Firefox, con `npm start` corriendo (ver [Navegadores](#navegadores)). Pide Node 22 o superior. |

Rutas:

| Ruta | Pantalla |
|---|---|
| `/` | Portada. |
| `/backoffice/ingresar` | Ingreso al backoffice. |
| `/backoffice` | Editor del backoffice (pide sesión). |

---

## Estructura

```
src/
├─ styles/                      tokens de la paleta, base y transiciones (globales)
└─ app/
   ├─ core/
   │  ├─ api/api.ts             base de la API, Page<T>, ApiError, interceptor del token
   │  └─ services/              tema, sonidos, almacenamiento, movimiento reducido
   ├─ shared/
   │  ├─ ui/atoms|molecules/    ícono, switch de tema
   │  ├─ three/                 avatar holográfico 3D (motor en public/avatar/avatar-holo.js)
   │  └─ utils/                 utilidades sin estado (normalizar texto)
   └─ features/
      ├─ portada/               portada y panel de cada perfil
      └─ backoffice/
         ├─ data/               modelo, carga inicial, operaciones, APIs y estado del editor
         ├─ ui/                 átomos del backoffice (marca, campos, switch, isla de avisos…)
         ├─ shell/              contenedor con el color de sección
         └─ pages/
            ├─ login/           ingreso
            └─ editor/          editor y sus componentes (capas, lienzo, inspectores)
```

**Convenciones**

- **Componentes:** cada componente es standalone, con `.ts`, `.html` y `.css` separados y estilos encapsulados.
- **Estilos:** solo tokens de `src/styles/tokens.css`. No se usan colores sueltos salvo los del sistema de diseño.
- **Botones del backoffice:** son de Angular Material (`mat-flat-button`, `mat-stroked-button`, `mat-button`, `mat-icon-button`; clase `bo-sm` para la versión chica). No usan un tema prearmado: `src/styles/backoffice-material.css` les pasa los tokens del sistema. La portada no usa Material.
- **Accesibilidad:** AA en tema claro y oscuro, foco visible, áreas táctiles de 44 px y teclado completo. Todo respeta "reducir movimiento".
- **Idioma:**
  - Interfaz en español rioplatense con voseo.
  - Código y claves de datos en inglés y camelCase, como el backend.
  - Comentarios en español, solo cuando explican el porqué.
- **Commits:** un título corto que diga qué cambió (`feat(backoffice): …`, `fix(portada): …`).

---

## Portada

- **Perfiles:** postulante, cliente y colaborador. El postulante tiene avatar 3D: arranca oscuro, se ilumina con el hover y gira al arrastrarlo.
- **Panel del postulante:**
  - Búsqueda de ofertas con IA y detalle de la oferta. Solo se muestran los campos públicos.
  - Carga del CV y formulario de contacto validado (nombre, DNI, email, WhatsApp, zona y puesto).
  - Al enviar, muestra el código de seguimiento. Si el backend rechaza la postulación, vuelve al formulario con el motivo.
  - Vistas previas de los temas: ofertas cercanas, aviso por WhatsApp y seguimiento de la postulación.
- **Ofertas:** con el backend salen de `GET /job-offers`. En modo simulado, de `public/mock/ofertas.json`, que tiene el formato de la ficha interna; `toJobPosting` deja solo lo que ve el postulante.

---

## Backoffice

Herramienta interna para que el equipo administre, sin tocar código, lo que ven y completan los **postulantes**, **clientes** y **colaboradores**. No es un portal: no lo usan los públicos, lo usa el equipo.

### Ingreso

Correo y contraseña. Por ahora valida contra usuarios de prueba (`MockAuthApi`):

| Usuario | Contraseña | Rol |
|---|---|---|
| `marketing@ejemplo.com` | `Marketing2026` | marketing |
| `admin@ejemplo.com` | `Backoffice2026` | admin |

- **Atajo:** el botón "Entrar con datos de ejemplo" entra como Marketing.
- **Duración de la sesión:** se guarda en `sessionStorage`, así que se cierra al cerrar la pestaña.
- **Rutas protegidas:** sin sesión, el guard manda al ingreso y después vuelve a la pantalla que se había pedido.

### Editor

Funciona como una herramienta de diseño, con tres paneles:

```
┌ Barra: público · deshacer/rehacer · estado · vista previa · Guardar borrador · Publicar ┐
├ Capas ──────────┬ Vista previa del portal ─────────┬ Propiedades ───────────────┤
│ secciones y     │ el portal elegido con su color    │ lo que está elegido:       │
│ campos,         │ (violeta, fucsia o menta). Cada    │ textos, tipo, reglas,      │
│ documentos,     │ elemento se elige con un clic.     │ color, opciones,           │
│ avisos, canales │                                    │ validación…                │
│ y textos        │                                    │                            │
└─────────────────┴────────────────────────────────────┴────────────────────────────┘
```

Qué se puede editar para cada público:

| Elemento | Propiedades |
|---|---|
| **Campos** | Etiqueta, texto de ejemplo, ayuda, tipo, obligatorio, visible, solo lectura, color, opciones y validación (mínimo, máximo, largo, formato y mensaje de error). Se suman, duplican, ordenan y borran. |
| **Secciones** | Título, descripción y pantalla donde aparecen. |
| **Documentos** | Nombre, obligatorio, formatos aceptados, tamaño máximo, vencimiento y ayuda. |
| **Avisos** | Tono (informativo, positivo o atención), título, mensaje, botón con enlace, fechas de vigencia y encendido o apagado. |
| **Canales y redes** | WhatsApp, teléfono, correo, web, LinkedIn, Instagram, Facebook, YouTube, X y TikTok, con nombre, dato, horario y visibilidad. |
| **Textos** | Títulos, bajadas y sugerencias que se leen en el portal. |

La carga inicial (`data/site-config.seed.ts`) trae los campos, documentos, avisos y canales que hoy muestran los tres portales.

**Flujo de trabajo**

- **Guardar borrador:** guarda sin cambiar nada en los portales.
- **Publicar:** antes revisa que no haya problemas, como etiquetas vacías, listas sin opciones, enlaces sin `https://` o fechas cruzadas. Si hay alguno, los lista y lleva a cada uno.
- **Deshacer y rehacer:** también con `Ctrl+Z` y `Ctrl+Shift+Z`. Lo que se tipea seguido cuenta como un solo paso.
- **Borrar:** siempre se puede deshacer desde el aviso que aparece.
- **Teclado:** `Ctrl+S` guarda el borrador y `Escape` suelta la selección.
- **Vista previa:** muestra el portal en escritorio o en celular. "Ver sin paneles" lo muestra como lo verá la persona.
- **En celular:** los tres paneles pasan a ser pestañas.
- **Salir con cambios sin guardar:** el navegador pide confirmación.

**Diseño**

- **Color de sección:** el backoffice usa el **azul** del sistema (`#2f6fe8`, en claro `#2158c4`), el único acento que no usa ningún portal.
- **Color de los campos:** se elige entre tokens (neutro, color del portal, positivo o alerta), no con colores libres. Así cualquier combinación mantiene el contraste AA.

---

## Conexión con el backend

El backend es `postulantes-back-vd`: NestJS, PostgreSQL y Docker, con la base `http://localhost:3000/api/v1`.

- **Base de la API:** está en `API_BASE_URL` (`core/api/api.ts`).
- **Errores:** `errorMessage()` entiende el formato de error del backend (`{ statusCode, error, message }`).
- **Token:** el interceptor agrega `Authorization: Bearer <token>` solo a los pedidos que van a la API.

Cada acceso a datos es una clase abstracta con dos implementaciones, la simulada y la HTTP:

| Servicio | Simulado | HTTP | Endpoint | Hoy usa |
|---|---|---|---|---|
| `OffersApi` | `MockOffersApi` (`public/mock/ofertas.json`) | `HttpOffersApi` | `GET /job-offers` | Backend |
| `CandidacyApi` | `MockCandidacyApi` | `HttpCandidacyApi` | `POST /cv`, `GET /zones`, `POST /applications` | Backend |
| `AuthApi` | `MockAuthApi` | `HttpAuthApi` | `POST /auth/login` | Simulado |
| `SiteConfigApi` | `MockSiteConfigApi` (`localStorage`) | `HttpSiteConfigApi` | `GET` / `PUT /backoffice/site-config`, `POST /backoffice/site-config/publish` (**a crear**) | Simulado |

**Cómo se elige**

- `src/app/app.backend.ts` tiene `USE_BACKEND`. En `true`, `provideBackendApis()` usa las versiones HTTP de la tabla; en `false`, todo vuelve a lo simulado sin tocar componentes.
- Para sumar otro servicio, agregarlo a `provideBackendApis()`: `{ provide: AuthApi, useClass: HttpAuthApi }`.

**Qué guarda la postulación**

1. **CV:** `POST /cv` guarda el archivo y devuelve un `cvId` y los datos que leyó la IA.
2. **Zona:** el texto se busca en `GET /zones`, sin tildes ni mayúsculas. Se envía `zoneId` solo si coincide.
3. **Postulación:** `POST /applications` crea o actualiza al postulante y vincula la oferta (`offerCode`) y el CV (`cvId`). Devuelve el código de seguimiento (`GG-XXXXXX`).

**Pasos para levantarlo**

1. Levantar el backend (`docker compose up`). Su CORS acepta solo `http://localhost:4200`, el puerto de `npm start`.
2. Si la API corre en otra URL, proveer `API_BASE_URL` en `app.config.ts`.

**Pendiente del lado del backend** (hoy no existe):

- **Configuración:** el módulo `site-config`, con el contrato documentado en `data/site-config.model.ts`.
- **Roles:**
  - Hoy son `admin` y `superadmin`.
  - Falta `marketing`, y aplicar `@Roles()` en las rutas del backoffice.
- **Entidades:** clientes, avisos y repositorio de documentos.

---

## Tests

Jest 30 con `jest-preset-angular` (zoneless):

| Archivo | Qué cubre |
|---|---|
| `features/backoffice/data/site-config.spec.ts` | Modelo, carga inicial y operaciones del editor. |
| `features/backoffice/data/backoffice-data.spec.ts` | Login, API simulada, interceptor y estado del editor (deshacer y guardado). |
| `features/backoffice/backoffice-ui.spec.ts` | Ingreso, guard, edición desde el panel y deshacer desde el aviso. |
| `features/portada/**/*.spec.ts` | Portada, ofertas, CV, formulario y postulación (simulada y HTTP). |

---

## Navegadores

Chrome, Edge, Firefox y Safari: las dos últimas versiones de cada uno, más Firefox ESR (la lista por defecto de Angular, `npx browserslist`).

**Prueba en Firefox:** con `npm start` corriendo, `npm run smoke:firefox`.

- Abre Firefox sin ventana y recorre la portada (figuras 3D, ofertas y formulario), el ancho de celular y el editor del backoffice.
- Falla si algo no aparece o si hay errores en la consola.
- No envía postulaciones, así que no deja datos en el backend.
- No necesita dependencias: maneja Firefox por WebDriver BiDi. Si Firefox no está en la ruta de siempre, indicarla con `FIREFOX_BIN`. `HEADED=1` muestra la ventana.

**Reglas para que se vea igual en todos**

- **Pesos con la fuente del sistema (`--font`):** usar solo 400, 600 o 700. Segoe UI no tiene 500: Chrome lo muestra como 600 y Firefox como 400. Plus Jakarta y DM Mono se cargan con 500, así que ahí sí se puede usar.
- **Transición de color al cambiar de público:** usa `@property`. Los navegadores que no lo soportan (Firefox antes de la 128) cambian el color sin transición; el resto funciona igual.

---

## Rendimiento en VS Code

`.vscode/settings.json` deja afuera del watcher y de la búsqueda lo que se regenera solo o no se edita: `.angular`, `dist`, el motor 3D minificado y los modelos. También usa el TypeScript del proyecto.

Si el editor sigue lento:

- **TypeScript:** abrí la paleta y elegí **"TypeScript: Select TypeScript Version" → "Use Workspace Version"**. La extensión *TypeScript Nightly* reemplaza al del proyecto y levanta dos servidores de hasta 3 GB cada uno; si no la necesitás, desactivala en este workspace.
- **Servidores olvidados:** no dejes `ng serve` corriendo en terminales que no usás. Cada uno ocupa cerca de 1 GB.
- **GitLens:** si lo usás poco, desactivalo en este workspace.
