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

## Comandos

```bash
npm start            # servidor de desarrollo en http://localhost:4200
npx ng build         # build de producción en dist/
npm test             # chequeo de tipos + tests de la app (Jest)
```
