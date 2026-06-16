// Repositorio de datos. Única frontera con localStorage: el resto de la app
// no conoce el mecanismo de persistencia. Para migrar a un backend (Supabase,
// Apps Script, etc.) se reimplementa este archivo respetando las firmas.

import type { AppConfig, Fichaje, Profesional } from '../types'
import { DEFAULT_PIN, STORAGE_KEYS } from './constants'

/** Error específico de la capa de persistencia para propagación tipada. */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch (error) {
    throw new StorageError(`No se pudo leer "${key}" de localStorage`, error)
  }
}

function writeList<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    throw new StorageError(`No se pudo escribir "${key}" en localStorage`, error)
  }
}

// --- Profesionales -----------------------------------------------------------

export function getProfesionales(): Profesional[] {
  return readList<Profesional>(STORAGE_KEYS.profesionales)
}

export function getProfesionalesActivos(): Profesional[] {
  return getProfesionales().filter((p) => p.activo)
}

export function findProfesional(dni: string): Profesional | undefined {
  return getProfesionales().find((p) => p.dni === dni)
}

export function existeDni(dni: string): boolean {
  return getProfesionales().some((p) => p.dni === dni)
}

/** Persiste un profesional nuevo. Asume validación previa (ver fichaje.ts). */
export function addProfesional(profesional: Profesional): void {
  const profesionales = getProfesionales()
  if (profesionales.some((p) => p.dni === profesional.dni)) {
    throw new StorageError(`Ya existe un profesional con DNI ${profesional.dni}`)
  }
  writeList(STORAGE_KEYS.profesionales, [...profesionales, profesional])
}

// --- Fichajes ----------------------------------------------------------------

export function getFichajes(): Fichaje[] {
  return readList<Fichaje>(STORAGE_KEYS.fichajes)
}

/** Fichajes de un profesional ordenados de forma ascendente por createdAt. */
export function getFichajesDe(dni: string): Fichaje[] {
  return getFichajes()
    .filter((f) => f.dni === dni)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function addFichaje(fichaje: Fichaje): void {
  writeList(STORAGE_KEYS.fichajes, [...getFichajes(), fichaje])
}

// --- Config ------------------------------------------------------------------

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.config)
    if (!raw) return { pin: DEFAULT_PIN }
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return { pin: parsed.pin ?? DEFAULT_PIN }
  } catch (error) {
    throw new StorageError('No se pudo leer la configuración', error)
  }
}
