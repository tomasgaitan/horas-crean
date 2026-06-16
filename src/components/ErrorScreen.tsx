import { motion } from 'framer-motion'
import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react'

interface ErrorScreenProps {
  mensaje: string
  onRetry: () => void
}

/** Pantalla de error de red/servidor con opción de volver a intentar. */
export default function ErrorScreen({ mensaje, onRetry }: ErrorScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-8"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600">
        <WarningCircle weight="fill" className="h-9 w-9" />
      </span>
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Algo salió mal</h1>
        <p className="text-zinc-500">{mensaje}</p>
      </div>
      <motion.button
        type="button"
        onClick={onRetry}
        whileTap={{ scale: 0.97, y: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white active:brightness-110"
      >
        <ArrowClockwise weight="bold" className="h-5 w-5" />
        Volver a intentar
      </motion.button>
    </motion.div>
  )
}
