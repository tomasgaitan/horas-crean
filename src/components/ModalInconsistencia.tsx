import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SignOut, Warning, X } from '@phosphor-icons/react'
import TimePicker from './TimePicker'
import { validarHoraEgreso } from '../lib/fichaje'
import type { Profesional } from '../types'

interface ModalInconsistenciaProps {
  profesional: Profesional
  /** Fecha del ingreso de un día anterior que quedó sin egreso (DD/MM/YYYY). */
  fecha: string
  /** Hora de ese ingreso abierto (HH:mm). */
  horaIngreso: string
  /** Registra el egreso faltante para la fecha del ingreso abierto. */
  onConfirm: (hora: string) => void
  onCancel: () => void
}

export default function ModalInconsistencia({
  profesional,
  fecha,
  horaIngreso,
  onConfirm,
  onCancel,
}: ModalInconsistenciaProps) {
  const [hora, setHora] = useState(horaIngreso)
  const [error, setError] = useState<string | null>(null)

  function cambiarHora(nueva: string) {
    setError(null)
    setHora(nueva)
  }

  function confirmar() {
    const v = validarHoraEgreso(hora, horaIngreso)
    if (!v.ok) {
      setError(v.error ?? 'Hora inválida')
      return
    }
    onConfirm(hora)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-7 p-8"
    >
      <div className="flex max-w-xl flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <Warning weight="fill" className="h-9 w-9" />
        </span>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          Fichaje pendiente
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {profesional.nombre}, quedó un ingreso sin salida
        </h1>
        <p className="text-zinc-600">
          El {fecha} ingresaste a las{' '}
          <span className="font-mono text-zinc-900">{horaIngreso}</span> y no registraste el egreso.
          Indicá a qué hora saliste ese día para continuar.
        </p>
      </div>

      <TimePicker value={hora} onChange={cambiarHora} />

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

      <div className="grid w-full max-w-md grid-cols-[auto_1fr] gap-3">
        <motion.button
          type="button"
          onClick={onCancel}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-6 py-5 text-lg font-medium text-zinc-600 active:bg-zinc-100"
        >
          <X weight="bold" className="h-5 w-5" />
          Cancelar
        </motion.button>
        <motion.button
          type="button"
          onClick={confirmar}
          whileTap={{ scale: 0.97, y: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-5 text-lg font-semibold text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:brightness-95"
        >
          <SignOut weight="bold" className="h-5 w-5" />
          Registrar egreso · {hora}
        </motion.button>
      </div>
    </motion.div>
  )
}
