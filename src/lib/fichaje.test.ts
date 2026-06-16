import { describe, expect, it } from 'vitest'
import {
  horaAMinutos,
  resolverAccion,
  validarDni,
  validarHoraEgreso,
  validarNombre,
  validarProfesionalNuevo,
} from './fichaje'

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
  it('acepta datos válidos', () => {
    expect(validarProfesionalNuevo('Bernabé', 'Quiroga', '41188294').ok).toBe(true)
  })

  it('propaga error de nombre vacío antes de validar el DNI', () => {
    const v = validarProfesionalNuevo('', 'Quiroga', '41188294')
    expect(v.ok).toBe(false)
    expect(v.error).toMatch(/nombre/i)
  })

  it('rechaza DNI inválido', () => {
    expect(validarProfesionalNuevo('Bernabé', 'Quiroga', '12').ok).toBe(false)
  })
})

describe('resolverAccion', () => {
  const HOY = '13/06/2026'

  it('sin sesión abierta → ingreso', () => {
    expect(resolverAccion(null, HOY)).toEqual({ tipo: 'ingreso' })
  })

  it('sesión abierta de hoy → egreso con la hora de ingreso', () => {
    const accion = resolverAccion({ fecha: HOY, horaIngreso: '09:00' }, HOY)
    expect(accion).toEqual({ tipo: 'egreso', horaIngreso: '09:00' })
  })

  it('sesión abierta de otro día → inconsistencia', () => {
    const accion = resolverAccion({ fecha: '12/06/2026', horaIngreso: '09:00' }, HOY)
    expect(accion).toEqual({ tipo: 'inconsistencia', fecha: '12/06/2026', horaIngreso: '09:00' })
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
