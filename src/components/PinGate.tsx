import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, LockKey } from '@phosphor-icons/react'
import Numpad from './Numpad'
import { PIN_LENGTH } from '../lib/constants'

interface PinGateProps {
  expectedPin: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PinGate({ expectedPin, onSuccess, onCancel }: PinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function agregarDigito(d: string) {
    setError(false)
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + d))
  }

  function borrar() {
    setError(false)
    setPin((prev) => prev.slice(0, -1))
  }

  // Verifica automáticamente al completar el PIN.
  useEffect(() => {
    if (pin.length < PIN_LENGTH) return
    if (pin === expectedPin) {
      onSuccess()
    } else {
      setError(true)
      const id = window.setTimeout(() => setPin(''), 500)
      return () => window.clearTimeout(id)
    }
  }, [pin, expectedPin, onSuccess])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 p-8">
      <button
        type="button"
        onClick={onCancel}
        className="absolute left-6 top-6 flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-600 active:bg-zinc-100"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </button>

      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
          <LockKey weight="bold" className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Administración</h1>
        <p className="text-sm text-zinc-500">Ingresá el PIN para continuar</p>
      </div>

      <motion.div
        animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex gap-4"
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const lleno = i < pin.length
          return (
            <span
              key={i}
              className={`h-5 w-5 rounded-full border-2 transition-colors ${
                error
                  ? 'border-rose-500 bg-rose-500'
                  : lleno
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-zinc-300 bg-transparent'
              }`}
            />
          )
        })}
      </motion.div>

      <div className="h-5">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-rose-600"
            >
              PIN incorrecto
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs">
        <Numpad onDigit={agregarDigito} onBackspace={borrar} />
      </div>
    </div>
  )
}
