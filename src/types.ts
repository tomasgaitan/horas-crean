// Modelo de dominio. La capa de persistencia (storage.ts) trabaja con estos tipos;
// migrar a un backend real implica reimplementar storage.ts sin tocar estos contratos.

export type TipoFichaje = 'ingreso' | 'egreso'

export interface Profesional {
  dni: string
  nombre: string
  apellido: string
  activo: boolean
}

export interface Fichaje {
  id: string
  dni: string
  nombre: string
  apellido: string
  /** Fecha en formato DD/MM/YYYY (zona horaria AR). */
  fecha: string
  /** Hora en formato HH:MM (24h). */
  hora: string
  tipo: TipoFichaje
  /** Marca de tiempo ISO del momento real de registro. Fuente de orden canónica. */
  createdAt: string
}

export interface AppConfig {
  pin: string
}
