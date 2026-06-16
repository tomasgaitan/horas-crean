# horas-crean

## Descripción
App web de fichaje de horarios para profesionales. Corre como kiosco táctil de pantalla única (tablet fija). Dos funciones: fichaje ingreso/egreso (público) y alta de profesionales (protegida por PIN). Sin routing.

## Contexto
Personal

## Stack usado en este proyecto
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Persistencia: localStorage (MVP), aislada en `src/lib/storage.ts`
- Librerías: framer-motion, @phosphor-icons/react, dayjs (+ plugins utc/timezone/customParseFormat)
- Tests: Vitest

## Proyectos relacionados
Ninguno

## Estado actual
MVP funcional con persistencia en localStorage. Build y tests en verde. Pendiente: migrar a backend real cuando se defina, y fase de pulido visual.

## Decisiones tomadas
- **Identificación por DNI** en numpad propio (sin teclado nativo en la pantalla pública).
- **Detección automática de tipo**: alterna ingreso/egreso; nunca dos iguales seguidos.
- **Reseteo diario con aviso**: cada día arranca esperando ingreso. Un ingreso de un día anterior sin egreso es una inconsistencia que se resuelve (registrando el egreso faltante) antes de fichar hoy. Soporta varios pares ingreso/egreso dentro del mismo día.
- **Edición de hora libre**: el TimePicker arranca en la hora actual y permite cualquier HH:MM (steppers con press-and-hold, granularidad 1 minuto). Validación blanda: el egreso no puede ser anterior al ingreso del día.
- **Alta de profesionales protegida por PIN** (seguridad liviana de kiosco, no criptográfica). PIN default `1234`, configurable con `VITE_DEFAULT_PIN`.
- **Sin vista/exportación de fichajes** por ahora: solo se persisten.
- **Capa de datos aislada** (`storage.ts`) para migrar a Supabase/Apps Script sin tocar la UI.
- **Lógica pura separada** (`fichaje.ts`, sin Date ni storage) → testeable; tests en `fichaje.test.ts`.
- **Timezone** America/Argentina/Buenos_Aires en `src/lib/dayjs.ts`.
- **Schema**: fecha (DD/MM/YYYY) y hora (HH:MM) en campos separados; `createdAt` (ISO) como orden canónico.
- **DNI**: solo numérico, 6 a 8 dígitos, único.
- **Diseño**: skill `design-taste-frontend` con dials ajustados al kiosco (VARIANCE 5 / MOTION 6 / DENSITY 3). Dark mode (zinc-950), Outfit + JetBrains Mono, acento emerald; semántica emerald=ingreso, amber=egreso, rose=error.

## Próximos pasos
- Conectar backend real (Supabase o Apps Script) reimplementando `storage.ts`.
- Eventual vista/exportación CSV de fichajes (detrás del PIN).
- Pulido visual final.

## Archivos clave
- `src/App.tsx`: máquina de estados (dni / inconsistencia / confirmacion / overlay / pin / admin).
- `src/lib/storage.ts`: repositorio localStorage (frontera de persistencia).
- `src/lib/fichaje.ts`: lógica pura (detección de tipo, inconsistencia, validaciones).
- `src/lib/dayjs.ts`: dayjs con timezone AR.
- `src/lib/constants.ts`: constantes (sin números/strings mágicos).
- `src/components/`: Clock, Numpad, DniEntry, TimePicker, ConfirmacionFichaje, FichajeOverlay, ModalInconsistencia, PinGate, AltaProfesional.

## Notas / contexto extra
- El teclado físico funciona en desarrollo (0-9, Backspace, Enter).
- `user-scalable=no` previene zoom en tablet; inputs de texto (alta) permiten edición/selección por excepción en `index.css`.
- Pantallas de fichaje sin scroll: `min-h-[100dvh]`.
