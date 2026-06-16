# horas-crean

## Descripción
App web de fichaje de horarios para profesionales. Corre como kiosco táctil de pantalla única (tablet fija). Dos funciones: fichaje ingreso/egreso (público) y alta de profesionales (protegida por PIN). Sin routing.

## Contexto
Personal

## Stack usado en este proyecto
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend / persistencia: Google Apps Script (web app) sobre Google Sheets — fuente de verdad. Aislado en `src/services/api.ts`.
- Librerías: framer-motion, @phosphor-icons/react, dayjs (+ plugins utc/timezone/customParseFormat)
- Tests: Vitest

## Proyectos relacionados
Ninguno

## Backend (Apps Script + Sheet)
- Código del backend: `apps-script/Code.gs`. La hoja es la fuente de verdad (profesionales + fichajes).
- Hoja `fichajes`: `profesional | dni | fecha | hora_ingreso | hora_egreso` (una fila por sesión: ingreso crea la fila, egreso la completa).
- Hoja `profesionales`: `dni | nombre | apellido | activo`.
- La URL del web app y el Sheet ID NO van en el repo (es público): viven en `VITE_APPS_SCRIPT_URL` (`.env` local + env var de Vercel) y en la memoria privada del proyecto. En `Code.gs`, `SHEET_ID` se deja vacío en el repo.
- Acciones del backend (todo por GET): `estado`, `ingreso`, `egreso`, `alta`, `profesionales`.
- Al cambiar `Code.gs`: re-deployar con "Nueva versión" para mantener la misma URL `/exec`.

## Estado actual
MVP funcional con backend en Google Sheets (Apps Script). Build y tests en verde. Deploy en Vercel con auto-deploy por push. Pendiente: fase de pulido visual.

## Decisiones tomadas
- **Identificación por DNI** en numpad propio (sin teclado nativo en la pantalla pública).
- **Detección automática de tipo**: alterna ingreso/egreso; nunca dos iguales seguidos.
- **Reseteo diario con aviso**: cada día arranca esperando ingreso. Un ingreso de un día anterior sin egreso es una inconsistencia que se resuelve (registrando el egreso faltante) antes de fichar hoy. Soporta varios pares ingreso/egreso dentro del mismo día.
- **Edición de hora libre**: el TimePicker arranca en la hora actual (redondeada al múltiplo de 5) y permite cualquier HH:MM; los minutos saltan de a 5 (steppers con press-and-hold). Validación blanda: el egreso no puede ser anterior al ingreso del día.
- **Alta de profesionales protegida por PIN** (seguridad liviana de kiosco, no criptográfica). PIN default `1234`, configurable con `VITE_DEFAULT_PIN`.
- **Datos a Google Sheets**: los fichajes y profesionales viven en la hoja (fuente de verdad). La app es async, con estados de carga y error. No hay visor de datos in-app: se consultan en la planilla.
- **Capa de red aislada** (`src/services/api.ts`) — única frontera con el backend; migrar a otro backend = reescribir ese archivo.
- **Lógica pura separada** (`fichaje.ts`, sin Date ni red) → testeable; tests en `fichaje.test.ts`.
- **Timezone** America/Argentina/Buenos_Aires en `src/lib/dayjs.ts`.
- **Schema**: una fila por sesión (`hora_ingreso` + `hora_egreso`), fecha (DD/MM/YYYY) y horas (HH:MM) como texto en la hoja.
- **DNI**: solo numérico, 6 a 8 dígitos, único.
- **Diseño**: skill `design-taste-frontend` con dials ajustados al kiosco (VARIANCE 5 / MOTION 6 / DENSITY 3). Light mode (fondo blanco), Outfit + JetBrains Mono, acento emerald; semántica emerald=ingreso, amber=egreso, rose=error.

## Próximos pasos
- Eventual vista/exportación de fichajes (la data ya está en la hoja).
- Pulido visual final.

## Archivos clave
- `src/App.tsx`: máquina de estados async (dni / inconsistencia / confirmacion / overlay / pin / admin / error) + overlay de carga.
- `src/services/api.ts`: capa de red al Apps Script (frontera de persistencia).
- `apps-script/Code.gs`: backend (web app sobre Sheets).
- `src/lib/fichaje.ts`: lógica pura (resolverAccion + validaciones).
- `src/lib/dayjs.ts`: dayjs con timezone AR.
- `src/lib/constants.ts`: constantes (sin números/strings mágicos).
- `src/components/`: CurrentDate, Numpad, DniEntry, TimePicker, ConfirmacionFichaje, FichajeOverlay, ModalInconsistencia, PinGate, AltaProfesional, LoadingOverlay, ErrorScreen.

## Kiosco / PWA
- La app es una **PWA instalable** (manifest en `public/manifest.webmanifest`, meta tags en `index.html`).
- `display: fullscreen` → al instalarla ("⋮ → Instalar app" en Chrome Android), se abre sin barra del navegador.
- **NO** se fuerza la orientación (se sacó `orientation`): respeta cómo esté la tablet. El layout es responsive (vertical u horizontal).
- Íconos generados desde `public/icon.svg` (reloj blanco sobre emerald): `icon-192/512/180.png`. Para regenerarlos: `qlmanage -t -s 1024 -o /tmp public/icon.svg` y luego `magick` a 512/192/180 (ImageMagick solo no renderiza el `stroke` del SVG; por eso se usa qlmanage).
- Tras cambiar el manifest, la PWA instalada hay que **reinstalarla** para que tome los cambios.
- Para kiosco blindado en Android (no salir, arranque al boot): Fully Kiosk Browser apuntando a la URL de producción.
- URL de producción: `https://profesionales-crean.vercel.app`.

## Notas / contexto extra
- El teclado físico funciona en desarrollo (0-9, Backspace, Enter).
- `user-scalable=no` previene zoom en tablet; inputs de texto (alta) permiten edición/selección por excepción en `index.css`.
- Pantallas de fichaje sin scroll: `min-h-[100dvh]`.
