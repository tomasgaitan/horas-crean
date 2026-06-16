import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { MINUTE_STEP } from '../lib/constants'

interface TimePickerProps {
  /** Hora en formato "HH:mm". */
  value: string
  onChange: (value: string) => void
}

const HOLD_DELAY_MS = 110

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Siguiente múltiplo de MINUTE_STEP hacia arriba (alinea a la grilla si hace falta). */
function minutoArriba(m: number): number {
  return (Math.floor(m / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP) % 60
}

/** Múltiplo de MINUTE_STEP hacia abajo (alinea a la grilla si hace falta). */
function minutoAbajo(m: number): number {
  const piso = Math.floor(m / MINUTE_STEP) * MINUTE_STEP
  return piso === m ? (m - MINUTE_STEP + 60) % 60 : piso
}

function parse(value: string): { h: number; m: number } {
  const [h, m] = value.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

/**
 * Selector de hora con edición libre (cualquier HH:mm). Mantener presionado un
 * stepper repite el incremento. Hueco e independiente para no re-renderizar el padre.
 */
export default function TimePicker({ value, onChange }: TimePickerProps) {
  const { h, m } = parse(value)

  const set = useCallback(
    (nextH: number, nextM: number) => {
      onChange(`${pad2((nextH + 24) % 24)}:${pad2((nextM + 60) % 60)}`)
    },
    [onChange],
  )

  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 px-8 py-6">
      <Columna
        label="Hora"
        onUp={() => set(h + 1, m)}
        onDown={() => set(h - 1, m)}
        value={pad2(h)}
      />
      <span className="pb-1 font-mono text-6xl font-bold text-zinc-300">:</span>
      <Columna
        label="Min"
        onUp={() => set(h, minutoArriba(m))}
        onDown={() => set(h, minutoAbajo(m))}
        value={pad2(m)}
      />
    </div>
  )
}

interface ColumnaProps {
  label: string
  value: string
  onUp: () => void
  onDown: () => void
}

function Columna({ label, value, onUp, onDown }: ColumnaProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Stepper onPress={onUp} aria-label={`Subir ${label}`}>
        <CaretUp weight="bold" className="h-7 w-7" />
      </Stepper>
      <span className="font-mono tabular text-7xl font-bold leading-none text-zinc-900">
        {value}
      </span>
      <Stepper onPress={onDown} aria-label={`Bajar ${label}`}>
        <CaretDown weight="bold" className="h-7 w-7" />
      </Stepper>
      <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  )
}

interface StepperProps {
  children: ReactNode
  onPress: () => void
  'aria-label': string
}

/** Botón que repite la acción mientras se mantiene presionado. */
function Stepper({ children, onPress, ...rest }: StepperProps) {
  const intervalRef = useRef<number | null>(null)
  // Ref para que el intervalo siempre llame a la versión más reciente de onPress.
  const onPressRef = useRef(onPress)
  onPressRef.current = onPress

  const detener = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const iniciar = useCallback(() => {
    onPressRef.current()
    detener()
    intervalRef.current = window.setInterval(() => onPressRef.current(), HOLD_DELAY_MS)
  }, [detener])

  // Limpieza ante desmontaje para no dejar intervalos colgados.
  useEffect(() => detener, [detener])

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      onPointerDown={iniciar}
      onPointerUp={detener}
      onPointerLeave={detener}
      onPointerCancel={detener}
      className="flex h-12 w-16 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 active:bg-emerald-500 active:text-white"
      {...rest}
    >
      {children}
    </motion.button>
  )
}
