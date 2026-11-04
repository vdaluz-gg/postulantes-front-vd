# Grupo Gestión · Front

Angular 22 (componentes standalone, signals, sin zone.js). Front de Grupo Gestión, siguiendo
el sistema de diseño de los portales (skill `grupo-gestion-ui`).

## Qué hay en la app

- **Portada** (`src/app/features/portada/`): elección de perfil (postulante, cliente,
  colaborador), avatar holográfico 3D del postulante (`src/app/shared/three/`), panel de cada
  perfil con consulta a la IA, sugerencias y vistas previas (mapa de ofertas cercanas, aviso por
  WhatsApp, seguimiento de la postulación).
- **Servicios comunes** (`src/app/core/services/`): tema, sonidos de interfaz, almacenamiento y
  movimiento reducido.
- **Estilos globales** (`src/styles/`): tokens de la paleta, base y transiciones de vista. Cada
  componente tiene sus propios `.ts`, `.html` y `.css`.

## Portal de postulantes

El portal del postulante (login, Inicio, hojas, datos y sus átomos, moléculas y organismos) está
**apartado en [`portal-postulantes/`](portal-postulantes/README.md)** para llevarlo a otro
repositorio. No está conectado a esta app: sus enlaces en la portada quedan deshabilitados
("Próximamente"). Ahí se explica qué contiene, qué dependencias compartidas usa y cómo volver a
integrarlo.

## Comandos

```bash
npm start            # servidor de desarrollo en http://localhost:4200
npx ng build         # build de producción en dist/
npm test             # chequeo de tipos + tests de la app (Jest)
npm run test:portal  # chequeo de tipos + tests del portal separado
```
