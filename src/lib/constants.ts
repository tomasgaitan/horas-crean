// Constantes compartidas — sin números ni strings mágicos dispersos por el código.

export const TIMEZONE = 'America/Argentina/Buenos_Aires'

export const FORMATO_FECHA = 'DD/MM/YYYY'
export const FORMATO_HORA = 'HH:mm'

/** Largo máximo de un DNI argentino (sin puntos). */
export const DNI_MAX_LENGTH = 8
/** Largo mínimo razonable para un DNI. */
export const DNI_MIN_LENGTH = 6

/** Largo máximo de nombre y apellido. */
export const NOMBRE_MAX_LENGTH = 40

/** Largo exacto del PIN de administración. */
export const PIN_LENGTH = 4

/** Paso de minutos en el selector de hora (09:00, 09:05, 09:10, …). */
export const MINUTE_STEP = 5

/** Duración del overlay de confirmación antes de volver a la pantalla inicial (ms). */
export const OVERLAY_DURATION_MS = 2800

export const STORAGE_KEYS = {
  profesionales: 'hc_profesionales',
  fichajes: 'hc_fichajes',
  config: 'hc_config',
} as const

/** PIN por defecto si no se define VITE_DEFAULT_PIN. Seguridad liviana de kiosco. */
export const DEFAULT_PIN = (import.meta.env.VITE_DEFAULT_PIN as string | undefined)?.trim() || '1234'
