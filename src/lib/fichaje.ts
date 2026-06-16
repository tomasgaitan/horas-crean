// Lógica de dominio pura: detección de la próxima acción y validaciones.
// Sin dependencias de red, storage ni `Date` → 100% testeable.

import type { SesionAbierta } from '../services/api'
import { DNI_MAX_LENGTH, DNI_MIN_LENGTH, NOMBRE_MAX_LENGTH } from './constants'

export interface Validacion {
  ok: boolean
  error?: string
}

const OK: Validacion = { ok: true }

// --- Validaciones ------------------------------------------------------------

export function validarDni(dni: string): Validacion {
  if (!dni) return { ok: false, error: 'Ingresá un DNI' }
  if (!/^\d+$/.test(dni)) return { ok: false, error: 'El DNI solo puede tener números' }
  if (dni.length < DNI_MIN_LENGTH) return { ok: false, error: 'El DNI es demasiado corto' }
  if (dni.length > DNI_MAX_LENGTH) return { ok: false, error: `Máximo ${DNI_MAX_LENGTH} dígitos` }
  return OK
}

export function validarNombre(valor: string, campo: 'Nombre' | 'Apellido'): Validacion {
  const limpio = valor.trim()
  if (!limpio) return { ok: false, error: `${campo} es obligatorio` }
  if (limpio.length > NOMBRE_MAX_LENGTH) {
    return { ok: false, error: `${campo} no puede superar ${NOMBRE_MAX_LENGTH} caracteres` }
  }
  return OK
}

/** Valida el formato de un profesional nuevo. El duplicado de DNI lo decide el backend. */
export function validarProfesionalNuevo(nombre: string, apellido: string, dni: string): Validacion {
  const vNombre = validarNombre(nombre, 'Nombre')
  if (!vNombre.ok) return vNombre
  const vApellido = validarNombre(apellido, 'Apellido')
  if (!vApellido.ok) return vApellido
  return validarDni(dni)
}

// --- Próxima acción ----------------------------------------------------------

export type ProximaAccion =
  | { tipo: 'ingreso' }
  | { tipo: 'egreso'; horaIngreso: string }
  | { tipo: 'inconsistencia'; fecha: string; horaIngreso: string }

/**
 * Determina qué corresponde hacer a partir de la sesión abierta del profesional:
 * - sin sesión abierta → ingreso (fila nueva)
 * - sesión abierta de hoy → egreso (completa la fila)
 * - sesión abierta de otro día → inconsistencia (cerrar ese egreso pasado primero)
 *
 * @param abierta sesión abierta del profesional (o null).
 * @param fechaHoy fecha actual en formato DD/MM/YYYY.
 */
export function resolverAccion(abierta: SesionAbierta | null, fechaHoy: string): ProximaAccion {
  if (!abierta) return { tipo: 'ingreso' }
  if (abierta.fecha !== fechaHoy) {
    return { tipo: 'inconsistencia', fecha: abierta.fecha, horaIngreso: abierta.horaIngreso }
  }
  return { tipo: 'egreso', horaIngreso: abierta.horaIngreso }
}

// --- Comparación de horas ----------------------------------------------------

/** Convierte "HH:mm" a minutos desde medianoche. */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** El egreso no puede ser anterior al ingreso del mismo día. */
export function validarHoraEgreso(horaEgreso: string, horaIngreso: string): Validacion {
  if (horaAMinutos(horaEgreso) < horaAMinutos(horaIngreso)) {
    return { ok: false, error: `El egreso no puede ser anterior al ingreso (${horaIngreso})` }
  }
  return OK
}
