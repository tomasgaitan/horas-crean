// Lógica de dominio pura: detección de tipo de fichaje, inconsistencias y
// validaciones. Sin dependencias de storage, red ni `Date` → 100% testeable.

import type { Fichaje, Profesional, TipoFichaje } from '../types'
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

export function validarProfesionalNuevo(
  nombre: string,
  apellido: string,
  dni: string,
  dniYaExiste: boolean,
): Validacion {
  const vNombre = validarNombre(nombre, 'Nombre')
  if (!vNombre.ok) return vNombre
  const vApellido = validarNombre(apellido, 'Apellido')
  if (!vApellido.ok) return vApellido
  const vDni = validarDni(dni)
  if (!vDni.ok) return vDni
  if (dniYaExiste) return { ok: false, error: 'Ya hay un profesional con ese DNI' }
  return OK
}

// --- Detección de tipo e inconsistencias -------------------------------------

/**
 * Inconsistencia = un ingreso de un día anterior que quedó sin su egreso.
 * Como dentro de un mismo día los fichajes alternan ingreso/egreso, el único
 * estado "abierto" posible es que el último fichaje sea un ingreso; si además
 * es de otro día, hay que resolverlo antes de fichar hoy.
 *
 * @param fichajes fichajes del profesional, ordenados ascendentemente por createdAt.
 * @param fechaHoy fecha actual en formato DD/MM/YYYY.
 */
export function detectarInconsistencia(fichajes: Fichaje[], fechaHoy: string): Fichaje | null {
  const ultimo = fichajes.at(-1)
  if (!ultimo) return null
  if (ultimo.tipo === 'ingreso' && ultimo.fecha !== fechaHoy) return ultimo
  return null
}

/**
 * Tipo que corresponde al próximo fichaje. Debe llamarse sólo cuando NO hay
 * inconsistencia pendiente (resolverla primero). Si el último fichaje es un
 * ingreso (necesariamente de hoy), toca egreso; en cualquier otro caso, ingreso.
 */
export function detectarProximoTipo(fichajes: Fichaje[]): TipoFichaje {
  const ultimo = fichajes.at(-1)
  if (!ultimo) return 'ingreso'
  return ultimo.tipo === 'ingreso' ? 'egreso' : 'ingreso'
}

/**
 * Ingreso abierto del día (último fichaje si es un ingreso). Sirve para validar
 * que el egreso no sea anterior al ingreso correspondiente.
 */
export function getIngresoAbierto(fichajes: Fichaje[]): Fichaje | null {
  const ultimo = fichajes.at(-1)
  return ultimo && ultimo.tipo === 'ingreso' ? ultimo : null
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

// --- Construcción de entidades -----------------------------------------------

/** Crea un Fichaje a partir de datos puros (id y createdAt los provee el caller). */
export function crearFichaje(
  profesional: Profesional,
  tipo: TipoFichaje,
  fecha: string,
  hora: string,
  createdAt: string,
  id: string,
): Fichaje {
  return {
    id,
    dni: profesional.dni,
    nombre: profesional.nombre,
    apellido: profesional.apellido,
    fecha,
    hora,
    tipo,
    createdAt,
  }
}
