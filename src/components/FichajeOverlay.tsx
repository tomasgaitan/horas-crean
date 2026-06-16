import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, SignIn, SignOut } from '@phosphor-icons/react'
import { OVERLAY_DURATION_MS } from '../lib/constants'
import type { Profesional, TipoFichaje } from '../types'

interface FichajeOverlayProps {
  tipo: TipoFichaje
  profesional: Profesional
  hora: string
  onDone: () => void
}

// Clases completas para el JIT de Tailwind.
const PRESENTACION: Record<
  TipoFichaje,
  { titulo: string; bg: string; texto: string; Icon: typeof SignIn }
> = {
  ingreso: { titulo: 'Ingreso registrado', bg: 'bg-emerald-500', texto: 'text-emerald-950', Icon: SignIn },
  egreso: { titulo: 'Egreso registrado', bg: 'bg-amber-500', texto: 'text-amber-950', Icon: SignOut },
}

export default function FichajeOverlay({ tipo, profesional, hora, onDone }: FichajeOverlayProps) {
  const { titulo, bg, texto, Icon } = PRESENTACION[tipo]

  useEffect(() => {
    const id = window.setTimeout(onDone, OVERLAY_DURATION_MS)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <motion.button
      type="button"
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 ${bg} ${texto}`}
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <CheckCircle weight="fill" className="h-32 w-32" />
      </motion.span>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 22 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2 text-lg font-semibold uppercase tracking-[0.2em] opacity-80">
          <Icon weight="bold" className="h-5 w-5" />
          {titulo}
        </div>
        <p className="text-center text-5xl font-bold tracking-tight">
          {profesional.nombre} {profesional.apellido}
        </p>
        <p className="font-mono tabular text-7xl font-bold">{hora}</p>
      </motion.div>
    </motion.button>
  )
}
