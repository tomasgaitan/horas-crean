import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, GearSix, Warning } from '@phosphor-icons/react'
import CurrentDate from './CurrentDate'
import Numpad from './Numpad'
import { validarDni } from '../lib/fichaje'
import { DNI_MAX_LENGTH } from '../lib/constants'

interface DniEntryProps {
  onSubmit: (dni: string) => void
  onAdmin: () => void
  /** Error proveniente de App (ej. DNI no registrado). */
  lookupError?: string | null
}

export default function DniEntry({ onSubmit, onAdmin, lookupError }: DniEntryProps) {
  const [dni, setDni] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const error = localError ?? lookupError ?? null

  function agregarDigito(d: string) {
    setLocalError(null)
    setDni((prev) => (prev.length >= DNI_MAX_LENGTH ? prev : prev + d))
  }

  function borrar() {
    setLocalError(null)
    setDni((prev) => prev.slice(0, -1))
  }

  function confirmar() {
    const validacion = validarDni(dni)
    if (!validacion.ok) {
      setLocalError(validacion.error ?? 'DNI inválido')
      return
    }
    onSubmit(dni)
    setDni('')
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
      {/* Panel izquierdo: reloj + identidad */}
      <section className="relative flex flex-col justify-between p-8 md:p-12">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Registro de horarios
          </span>
        </div>

        <CurrentDate />

        <button
          type="button"
          onClick={onAdmin}
          aria-label="Administración"
          className="flex w-fit items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-500 transition-colors active:bg-zinc-100"
        >
          <GearSix className="h-5 w-5" />
          <span className="text-sm">Administración</span>
        </button>
      </section>

      {/* Panel derecho: ingreso de DNI + numpad */}
      <section className="flex flex-col justify-center gap-6 border-t border-zinc-200 bg-zinc-50 p-8 md:border-l md:border-t-0 md:p-12">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-600">Ingresá tu DNI</label>
          <DniDisplay dni={dni} />
          <div className="h-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key={error}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-rose-600"
                >
                  <Warning weight="fill" className="h-4 w-4" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Numpad
          onDigit={agregarDigito}
          onBackspace={borrar}
          onSubmit={confirmar}
          submitDisabled={dni.length === 0}
          submitIcon={<ArrowRight weight="bold" className="h-9 w-9" />}
        />
      </section>
    </div>
  )
}

function DniDisplay({ dni }: { dni: string }) {
  return (
    <div className="flex h-20 items-center rounded-2xl border border-zinc-200 bg-white px-5">
      {dni ? (
        <span className="font-mono tabular text-4xl tracking-[0.3em] text-zinc-900">{dni}</span>
      ) : (
        <span className="font-mono tabular text-4xl tracking-[0.3em] text-zinc-300">––––––––</span>
      )}
    </div>
  )
}
