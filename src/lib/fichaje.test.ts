import { describe, expect, it } from 'vitest'
import type { Fichaje, Profesional, TipoFichaje } from '../types'
import {
  crearFichaje,
  detectarInconsistencia,
  detectarProximoTipo,
  getIngresoAbierto,
  horaAMinutos,
  validarDni,
  validarHoraEgreso,
  validarNombre,
  validarProfesionalNuevo,
} from './fichaje'

const PROF: Profesional = { dni: '41188294', nombre: 'Bernabé', apellido: 'Quiroga', activo: true }

function fichaje(tipo: TipoFichaje, fecha: string, hora: string, createdAt: string): Fichaje {
  return { ...crearFichaje(PROF, tipo, fecha, hora, createdAt, `id-${createdAt}`) }
}

describe('validarDni', () => {
  it('acepta un DNI numérico válido', () => {
    expect(validarDni('41188294')).toEqual({ ok: true })
  })

  it('rechaza vacío', () => {
    expect(validarDni('').ok).toBe(false)
  })

  it('rechaza no numérico', () => {
    expect(validarDni('411A8294').ok).toBe(false)
  })

  it('rechaza demasiado corto', () => {
    expect(validarDni('123').ok).toBe(false)
  })

  it('rechaza más de 8 dígitos', () => {
    expect(validarDni('123456789').ok).toBe(false)
  })

  it('acepta el largo mínimo (6) y máximo (8)', () => {
    expect(validarDni('123456').ok).toBe(true)
    expect(validarDni('12345678').ok).toBe(true)
  })
})

describe('validarNombre', () => {
  it('acepta un nombre normal', () => {
    expect(validarNombre('Bernabé', 'Nombre').ok).toBe(true)
  })

  it('rechaza vacío o sólo espacios', () => {
    expect(validarNombre('', 'Nombre').ok).toBe(false)
    expect(validarNombre('   ', 'Apellido').ok).toBe(false)
  })

  it('rechaza un nombre demasiado largo', () => {
    expect(validarNombre('x'.repeat(41), 'Nombre').ok).toBe(false)
  })
})

describe('validarProfesionalNuevo', () => {
  it('acepta datos válidos sin duplicado', () => {
    expect(validarProfesionalNuevo('Bernabé', 'Quiroga', '41188294', false).ok).toBe(true)
  })

  it('rechaza DNI duplicado', () => {
    const v = validarProfesionalNuevo('Bernabé', 'Quiroga', '41188294', true)
    expect(v.ok).toBe(false)
    expect(v.error).toMatch(/ya hay un profesional/i)
  })

  it('propaga error de nombre vacío antes de validar el DNI', () => {
    const v = validarProfesionalNuevo('', 'Quiroga', '41188294', false)
    expect(v.ok).toBe(false)
    expect(v.error).toMatch(/nombre/i)
  })
})

describe('detectarInconsistencia', () => {
  const HOY = '13/06/2026'

  it('devuelve null sin fichajes', () => {
    expect(detectarInconsistencia([], HOY)).toBeNull()
  })

  it('devuelve null si el último fichaje de hoy es un ingreso (estado abierto normal)', () => {
    const fs = [fichaje('ingreso', HOY, '09:00', '2026-06-13T09:00:00')]
    expect(detectarInconsistencia(fs, HOY)).toBeNull()
  })

  it('detecta un ingreso de un día anterior sin egreso', () => {
    const fs = [fichaje('ingreso', '12/06/2026', '09:00', '2026-06-12T09:00:00')]
    const inc = detectarInconsistencia(fs, HOY)
    expect(inc).not.toBeNull()
    expect(inc?.fecha).toBe('12/06/2026')
  })

  it('devuelve null si el último fichaje es un egreso', () => {
    const fs = [
      fichaje('ingreso', '12/06/2026', '09:00', '2026-06-12T09:00:00'),
      fichaje('egreso', '12/06/2026', '17:00', '2026-06-12T17:00:00'),
    ]
    expect(detectarInconsistencia(fs, HOY)).toBeNull()
  })
})

describe('detectarProximoTipo', () => {
  it('sin fichajes → ingreso', () => {
    expect(detectarProximoTipo([])).toBe('ingreso')
  })

  it('último ingreso → egreso', () => {
    const fs = [fichaje('ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00')]
    expect(detectarProximoTipo(fs)).toBe('egreso')
  })

  it('último egreso → ingreso', () => {
    const fs = [
      fichaje('ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00'),
      fichaje('egreso', '13/06/2026', '13:00', '2026-06-13T13:00:00'),
    ]
    expect(detectarProximoTipo(fs)).toBe('ingreso')
  })

  it('soporta varios pares en el mismo día (ingreso → egreso → ingreso → egreso)', () => {
    const fs = [
      fichaje('ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00'),
      fichaje('egreso', '13/06/2026', '13:00', '2026-06-13T13:00:00'),
      fichaje('ingreso', '13/06/2026', '14:00', '2026-06-13T14:00:00'),
    ]
    expect(detectarProximoTipo(fs)).toBe('egreso')
  })
})

describe('getIngresoAbierto', () => {
  it('devuelve el último fichaje si es un ingreso', () => {
    const ing = fichaje('ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00')
    expect(getIngresoAbierto([ing])?.hora).toBe('09:00')
  })

  it('devuelve null si el último es un egreso o no hay fichajes', () => {
    const fs = [
      fichaje('ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00'),
      fichaje('egreso', '13/06/2026', '17:00', '2026-06-13T17:00:00'),
    ]
    expect(getIngresoAbierto(fs)).toBeNull()
    expect(getIngresoAbierto([])).toBeNull()
  })
})

describe('horaAMinutos', () => {
  it('convierte correctamente', () => {
    expect(horaAMinutos('00:00')).toBe(0)
    expect(horaAMinutos('09:05')).toBe(545)
    expect(horaAMinutos('23:59')).toBe(1439)
  })
})

describe('validarHoraEgreso', () => {
  it('rechaza un egreso anterior al ingreso', () => {
    expect(validarHoraEgreso('08:00', '09:00').ok).toBe(false)
  })

  it('acepta un egreso igual o posterior al ingreso', () => {
    expect(validarHoraEgreso('09:00', '09:00').ok).toBe(true)
    expect(validarHoraEgreso('17:30', '09:00').ok).toBe(true)
  })
})

describe('crearFichaje', () => {
  it('mapea los datos del profesional', () => {
    const f = crearFichaje(PROF, 'ingreso', '13/06/2026', '09:00', '2026-06-13T09:00:00', 'abc')
    expect(f).toEqual({
      id: 'abc',
      dni: '41188294',
      nombre: 'Bernabé',
      apellido: 'Quiroga',
      fecha: '13/06/2026',
      hora: '09:00',
      tipo: 'ingreso',
      createdAt: '2026-06-13T09:00:00',
    })
  })
})
