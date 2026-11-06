# Grupo Gestión · Front

Front de Grupo Gestión en Angular 22: componentes standalone, signals y sin zone.js. Sigue el sistema de diseño de los portales (skill `grupo-gestion-ui`).

Tiene dos partes:

- **Portada**: los postulantes, clientes y colaboradores eligen su perfil.
- **Backoffice**: el equipo administra lo que esos tres públicos ven y completan.

Las ofertas, la postulación (datos, CV y campos agregados), el ingreso al backoffice y la configuración que publica el backoffice usan la API de [`postulantes-back-vd`](#conexión-con-el-backend). Cada servicio cambia de simulado a HTTP sin tocar pantallas.

---

## Arrancar

Requisitos: Node 20 o superior (recomendado 22) y npm.

```bash
npm install
npm start            # http://localhost:4200
```

| Comando                    | Qué hace                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm start`                | Servidor de desarrollo con recarga.                                                                              |
| `npx ng build`             | Build de producción en `dist/`. Falla si un CSS de componente pasa el presupuesto.                               |
| `npm test`                 | Chequeo de tipos (app y tests) y después todos los tests de Jest.                                                |
| `npm run typecheck`        | Solo el chequeo de tipos.                                                                                        |
| `npx jest ruta/al.spec.ts` | Un archivo de tests.                                                                                             |
| `npm run smoke:firefox`    | Prueba de humo en Firefox, con `npm start` corriendo (ver [Navegadores](#navegadores)). Pide Node 22 o superior. |

Rutas:

| Ruta                   | Pantalla                             |
| ---------------------- | ------------------------------------ |
| `/`                    | Portada.                             |
| `/backoffice/ingresar` | Ingreso al backoffice.               |
| `/backoffice`          | Editor del backoffice (pide sesión). |

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
  - Carga del CV y formulario de contacto validado. Los campos, su orden, etiquetas, textos de ejemplo, ayudas y reglas salen de lo publicado en el backoffice (ver [Lo que publica el backoffice](#lo-que-publica-el-backoffice)).
  - Al enviar, muestra el código de seguimiento. Si el backend rechaza la postulación, vuelve al formulario con el motivo.
  - Vistas previas de los temas: ofertas cercanas, aviso por WhatsApp y seguimiento de la postulación.
- **Panel de Empresas** (datos de ejemplo, como la maqueta):
  - Cada servicio (personal eventual, búsqueda y selección, RPO, outsourcing de capital humano y de procesos) tiene su vista previa animada, descripción y qué incluye.
  - La consulta o una sugerencia recomiendan el servicio que corresponde. "Armar mi propuesta" escribe la propuesta (servicio, dotación, zona y plazo) y "Enviar a un asesor" la confirma.
  - "Hablar con un asesor" muestra el teléfono de atención.
- **Panel de Colaboradores** (datos de ejemplo; las fechas se calculan desde hoy):
  - Fecha de cobro, recibos para firmar, carga de un certificado (foto o PDF; no sale del navegador) y seguimiento de la tarjeta de débito.
  - La consulta abre el tema que corresponde o deriva a atención al colaborador.
  - "Gestión Virtual" muestra los accesos y "Descargar la app" ofrece mandar el enlace.
- **"Ingresar a tu portal":** los portales privados no están en esta app (el del postulante vive en otro repo). Mientras tanto, el botón lleva a la consulta con la IA del panel.
- **Avisos:** la confirmación de cada acción aparece abajo, en un aviso breve que también lee el lector de pantalla.

### Lo que publica el backoffice

La portada pide `GET /site-config/postulantes` cada vez que se abre (`PublishedConfigApi`, `published-config.ts`). Si todavía no se publicó nada, usa la configuración inicial.

- **Formulario de postulación** (sección `application`): campos nuevos de cualquier tipo (texto, correo, teléfono, número, fecha, texto largo, lista, píldoras y sí/no), orden, etiqueta, texto de ejemplo, ayuda, obligatorio, visible, solo lectura, color y validación.
  - Nombre, apellido, DNI, email y WhatsApp siempre se piden: el backend los necesita. El backoffice no deja publicar si se ocultan o se vuelven opcionales.
  - El CUIL es opcional. Se valida con su dígito verificador y tiene que coincidir con el DNI.
  - Una configuración guardada antes de separar nombre y apellido se pone al día sola al abrirla (`site-config.upgrade.ts`): "Nombre y apellido" pasa a ser "Nombre" y "Apellido", y se suma el CUIL después del DNI.
  - Las respuestas a los campos nuevos viajan como `answers` en `POST /applications` y quedan guardadas con la postulación.
- **Textos del panel:** etiqueta superior, título (se resalta lo que sigue a la última coma), texto del buscador, sugerencias y pie.
- **Avisos:** los activos y en fecha aparecen en el panel del postulante.
- **Ofertas:** con el backend salen de `GET /job-offers`. En modo simulado, de `public/mock/ofertas.json`, que tiene el formato de la ficha interna; `toJobPosting` deja solo lo que ve el postulante.

---

## Backoffice

Herramienta interna para que el equipo administre, sin tocar código, lo que ven y completan los **postulantes**, **clientes** y **colaboradores**. No es un portal: no lo usan los públicos, lo usa el equipo.

### Ingreso

Correo y contraseña contra el backend: `POST /auth/login` devuelve un JWT y el perfil.

**Cuentas de desarrollo.** Hay que darlas de alta una vez en la base local, con `POST /auth/register` y la clave `ADMIN_REGISTRATION_KEY` del `.env` del backend:

| Usuario                 | Contraseña       | Rol en el backend                              |
| ----------------------- | ---------------- | ---------------------------------------------- |
| `marketing@ejemplo.com` | `Marketing2026`  | `admin` (el rol `marketing` todavía no existe) |
| `admin@ejemplo.com`     | `Backoffice2026` | `admin`                                        |

```bash
curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","fullName":"Administración","password":"Backoffice2026","registrationKey":"<clave del .env>"}'
```

Estas cuentas son solo para desarrollo: **no crearlas en producción**, porque la contraseña está en este README y en el código.

- **Atajo:** el botón "Entrar con datos de ejemplo" entra como Marketing. Solo aparece en desarrollo (`isDevMode()`).
- **Duración de la sesión:**
  - Se guarda en `sessionStorage`, así que se cierra al cerrar la pestaña.
  - El token del backend dura 8 horas (`JWT_EXPIRES_IN`).
- **Rutas protegidas:**
  - Sin sesión, el guard manda al ingreso y después vuelve a la pantalla que se había pedido.
  - Al entrar al editor con una sesión guardada, el guard la confirma con `GET /auth/me` y actualiza el perfil.
- **Sesión vencida:**
  - Si el servidor rechaza el token (401), la sesión se cierra y el ingreso avisa "Tu sesión venció".
  - Después de ingresar, vuelve a la misma pantalla.
  - El interceptor avisa con `API_UNAUTHORIZED`, así que también vale para cualquier pedido futuro del backoffice.
  - Si el servidor no responde, deja pasar: igual la API rechaza lo que no corresponda.
- **Modo simulado:** con `USE_BACKEND = false`, `MockAuthApi` valida contra estas mismas cuentas sin backend.

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

| Elemento            | Propiedades                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Campos**          | Etiqueta, texto de ejemplo, ayuda, tipo, obligatorio, visible, solo lectura, color, opciones y validación (mínimo, máximo, largo, formato y mensaje de error). Se suman, duplican, ordenan y borran. |
| **Secciones**       | Título, descripción y pantalla donde aparecen.                                                                                                                                                       |
| **Documentos**      | Nombre, obligatorio, formatos aceptados, tamaño máximo, vencimiento y ayuda.                                                                                                                         |
| **Avisos**          | Tono (informativo, positivo o atención), título, mensaje, botón con enlace, fechas de vigencia y encendido o apagado.                                                                                |
| **Canales y redes** | WhatsApp, teléfono, correo, web, LinkedIn, Instagram, Facebook, YouTube, X y TikTok, con nombre, dato, horario y visibilidad.                                                                        |
| **Textos**          | Títulos, bajadas y sugerencias que se leen en el portal.                                                                                                                                             |

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

| Servicio             | Simulado                                                  | HTTP                     | Endpoint                                                                      | Hoy usa |
| -------------------- | --------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- | ------- |
| `OffersApi`          | `MockOffersApi` (`public/mock/ofertas.json`)              | `HttpOffersApi`          | `GET /job-offers`                                                             | Backend |
| `CandidacyApi`       | `MockCandidacyApi`                                        | `HttpCandidacyApi`       | `POST /cv`, `GET /zones`, `POST /applications`                                | Backend |
| `AuthApi`            | `MockAuthApi`                                             | `HttpAuthApi`            | `POST /auth/login`, `GET /auth/me`                                            | Backend |
| `SiteConfigApi`      | `MockSiteConfigApi` (`localStorage`)                      | `HttpSiteConfigApi`      | `GET` / `PUT /backoffice/site-config`, `POST /backoffice/site-config/publish` | Backend |
| `PublishedConfigApi` | `MockPublishedConfigApi` (lo publicado en `localStorage`) | `HttpPublishedConfigApi` | `GET /site-config/:audience`                                                  | Backend |

**Cómo se elige**

- `src/app/app.backend.ts` tiene `USE_BACKEND`. En `true`, `provideBackendApis()` usa las versiones HTTP de la tabla; en `false`, todo vuelve a lo simulado sin tocar componentes.
- Para sumar otro servicio, agregarlo a `provideBackendApis()`: `{ provide: AuthApi, useClass: HttpAuthApi }`.

**Qué guarda la postulación**

1. **CV:** `POST /cv` guarda el archivo y devuelve un `cvId` y los datos que encontró en el texto del archivo (nombre, apellido, mail, DNI, CUIL, WhatsApp y zona). Un PDF escaneado no trae texto: el formulario queda para completar a mano.
2. **Zona:** el texto se busca en `GET /zones`, sin tildes ni mayúsculas. Se envía `zoneId` solo si coincide.
3. **Postulación:** `POST /applications` crea o actualiza al postulante y vincula la oferta (`offerCode`) y el CV (`cvId`). Las respuestas a los campos agregados desde el backoffice van en `answers`; el backend las revisa contra lo publicado y las guarda con su etiqueta. Devuelve el código de seguimiento (`GG-XXXXXX`).

**Configuración del backoffice**

- **Guardar** crea una versión nueva (borrador) y **Publicar** crea una versión publicada: queda el historial completo.
- Si otra persona guardó mientras se editaba, el backend responde 409 y el editor muestra el motivo: hay que recargar.
- Si todavía no se guardó nada, `GET /backoffice/site-config` da 404 y el editor arranca de la configuración inicial.

**Pasos para levantarlo**

1. Levantar el backend (`docker compose up`). Su CORS acepta solo `http://localhost:4200`, el puerto de `npm start`.
2. Si la API corre en otra URL, proveer `API_BASE_URL` en `app.config.ts`.

**Pendiente del lado del backend** (hoy no existe):

- **Rol `marketing`:**
  - Hoy los roles son `admin` y `superadmin`, y `POST /auth/register` siempre crea `admin`.
  - Falta sumar `marketing` a `ADMIN_ROLES` (`auth/entities/admin.entity.ts`) y una forma de elegir el rol al dar el alta (por ejemplo, que solo un `superadmin` pueda hacerlo).
- **Permisos por ruta:**
  - Ninguna ruta del backoffice usa `@Roles()`, así que cualquier cuenta entra a todo.
  - Hoy la cuenta de marketing puede leer postulantes y postulaciones (`/backoffice/candidates`, `/backoffice/applications`), con datos personales.
  - Hay que restringir esas rutas a `admin` y `superadmin` cuando exista `marketing`.
- **Cuentas:** no hay cómo crear un `superadmin`, cambiar o recuperar la contraseña, ni cerrar la sesión del lado del servidor (el token vale hasta que vence).
- **Entidades:** clientes, avisos y repositorio de documentos.

---

## Tests

Jest 30 con `jest-preset-angular` (zoneless):

| Archivo                                            | Qué cubre                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `features/backoffice/data/site-config.spec.ts`     | Modelo, carga inicial y operaciones del editor.                                    |
| `features/backoffice/data/backoffice-data.spec.ts` | Login, API simulada, interceptor y estado del editor (deshacer y guardado).        |
| `features/backoffice/backoffice-ui.spec.ts`        | Ingreso, guard, edición desde el panel y deshacer desde el aviso.                  |
| `features/portada/**/*.spec.ts`                    | Portada, ofertas, CV, formulario y postulación (simulada y HTTP).                  |
| `features/portada/published-config.spec.ts`        | Campos, textos y avisos publicados en el backoffice, y el envío de las respuestas. |
| `features/portada/empresas-colaboradores.spec.ts`  | Paneles de Empresas y Colaboradores.                                               |

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

- **TypeScript:** abrí la paleta y elegí **"TypeScript: Select TypeScript Version" → "Use Workspace Version"**. La extensión _TypeScript Nightly_ reemplaza al del proyecto y levanta dos servidores de hasta 3 GB cada uno; si no la necesitás, desactivala en este workspace.
- **Servidores olvidados:** no dejes `ng serve` corriendo en terminales que no usás. Cada uno ocupa cerca de 1 GB.
- **GitLens:** si lo usás poco, desactivalo en este workspace.
