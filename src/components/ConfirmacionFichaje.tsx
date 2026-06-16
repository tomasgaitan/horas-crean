import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SignIn, SignOut, Warning, X } from '@phosphor-icons/react'
import TimePicker from './TimePicker'
import { validarHoraEgreso } from '../lib/fichaje'
import type { Profesional, TipoFichaje } from '../types'

interface ConfirmacionFichajeProps {
  profesional: Profesional
  tipo: TipoFichaje
  /** Hora propuesta por defecto (hora actual). */
  horaInicial: string
  /** Hora del ingreso abierto, para validar que el egreso no sea anterior. */
  horaIngresoAbierto?: string | null
  onConfirm: (hora: string) => void
  onCancel: () => void
}

// Clases completas (no interpoladas) para que el JIT de Tailwind no las purgue.
const PRESENTACION: Record<
  TipoFichaje,
  { titulo: string; Icon: typeof SignIn; iconWrap: string; label: string; button: string }
> = {
  ingreso: {
    titulo: 'Ingreso',
    Icon: SignIn,
    iconWrap: 'bg-emerald-500/15 text-emerald-600',
    label: 'text-emerald-600',
    button: 'bg-emerald-500 text-emerald-950',
  },
  egreso: {
    titulo: 'Egreso',
    Icon: SignOut,
    iconWrap: 'bg-amber-500/15 text-amber-600',
    label: 'text-amber-600',
    button: 'bg-amber-500 text-amber-950',
  },
}

export default function ConfirmacionFichaje({
  profesional,
  tipo,
  horaInicial,
  horaIngresoAbierto,
  onConfirm,
  onCancel,
}: ConfirmacionFichajeProps) {
  const [hora, setHora] = useState(horaInicial)
  const [error, setError] = useState<string | null>(null)
  const { titulo, Icon, iconWrap, label, button } = PRESENTACION[tipo]

  function cambiarHora(nueva: string) {
    setError(null)
    setHora(nueva)
  }

  function confirmar() {
    if (tipo === 'egreso' && horaIngresoAbierto) {
      const v = validarHoraEgreso(hora, horaIngresoAbierto)
      if (!v.ok) {
        setError(v.error ?? 'Hora inválida')
        return
      }
    }
    onConfirm(hora)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 p-8"
    >
      <div className="flex flex-col items-center gap-3">
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrap}`}>
          <Icon weight="bold" className="h-9 w-9" />
        </span>
        <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${label}`}>
          Registrar {titulo}
        </p>
        <h1 className="text-center text-4xl font-semibold tracking-tight text-zinc-900">
          {profesional.nombre} {profesional.apellido}
        </h1>
        <p className="font-mono text-sm text-zinc-500">DNI {profesional.dni}</p>
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
          className={`rounded-2xl px-6 py-5 text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:brightness-95 ${button}`}
        >
          Confirmar {titulo} · {hora}
        </motion.button>
      </div>
    </motion.div>
  )
}
