// Modelo de dominio del cliente.

export type TipoFichaje = 'ingreso' | 'egreso'

export interface Profesional {
  dni: string
  nombre: string
  apellido: string
  activo: boolean
}
