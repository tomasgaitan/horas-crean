import { motion } from 'framer-motion'

interface LoadingOverlayProps {
  mensaje?: string
}

/** Overlay de carga para operaciones contra el backend. */
export default function LoadingOverlay({ mensaje = 'Procesando…' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-white/80 backdrop-blur-sm"
    >
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3.5 w-3.5 rounded-full bg-emerald-500"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -6, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-zinc-500">{mensaje}</p>
    </motion.div>
  )
}
