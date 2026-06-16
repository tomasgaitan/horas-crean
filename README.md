# horas-crean

App de fichaje de horarios para profesionales. Corre como kiosco táctil de pantalla única.

## Funcionalidades

- **Fichaje ingreso/egreso**: el profesional ingresa su DNI en un numpad; el sistema detecta automáticamente si corresponde ingreso o egreso (nunca dos iguales seguidos) y permite ajustar la hora antes de confirmar.
- **Reseteo diario con aviso**: cada día arranca esperando un ingreso. Si quedó un ingreso de un día anterior sin egreso, se pide resolver esa inconsistencia (registrar el egreso faltante) antes de continuar.
- **Alta de profesionales** (protegida por PIN): nombre, apellido y DNI.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- `dayjs` (timezone America/Argentina/Buenos_Aires), `framer-motion`, `@phosphor-icons/react`
- Persistencia actual: `localStorage` (aislada en `src/lib/storage.ts` para migrar a un backend sin tocar la UI)
- Tests: Vitest sobre la lógica pura

## Setup

```bash
cp .env.example .env   # opcional: definir VITE_DEFAULT_PIN (si no, usa 1234)
npm install
npm run dev
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — typecheck + build de producción
- `npm test` — corre los tests
- `npm run test:watch` — tests en watch

## Modelo de datos (localStorage)

- `hc_profesionales`: `{ dni, nombre, apellido, activo }`
- `hc_fichajes`: `{ id, dni, nombre, apellido, fecha (DD/MM/YYYY), hora (HH:MM), tipo, createdAt (ISO) }`
- `hc_config`: `{ pin }`

## Administración

Botón "Administración" en la pantalla principal → PIN → alta de profesionales.
PIN por defecto: `1234` (configurable con `VITE_DEFAULT_PIN`). Es seguridad liviana de kiosco, no criptográfica.

## Deploy

Pensado para Vercel. Definir `VITE_DEFAULT_PIN` en las variables de entorno del proyecto.

## Notas de kiosco

- `user-scalable=no` evita el zoom en la tablet.
- El DNI se ingresa por numpad propio (sin teclado nativo); el alta de profesionales sí usa inputs nativos (teclado del tablet).
- Sin scroll en las pantallas de fichaje: `overflow` contenido + `min-h-[100dvh]`.
- El teclado físico funciona en desarrollo (0-9, Backspace, Enter).
