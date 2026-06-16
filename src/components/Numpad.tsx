import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Backspace, Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface NumpadProps {
  onDigit: (digito: string) => void
  onBackspace: () => void
  /** Si se provee, muestra el botón de confirmar en la esquina inferior derecha. */
  onSubmit?: () => void
  submitDisabled?: boolean
  submitIcon?: ReactNode
  /** Escucha teclado físico (0-9, Backspace, Enter). Útil en desarrollo. */
  enableKeyboard?: boolean
}

const DIGITOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

const TAP = { scale: 0.94, y: 1 }
const SPRING = { type: 'spring', stiffness: 420, damping: 28 } as const

/**
 * Teclado numérico para kiosco. El display (dígitos visibles, máscara de PIN,
 * etc.) lo renderiza el componente padre; este componente sólo emite eventos.
 */
export default function Numpad({
  onDigit,
  onBackspace,
  onSubmit,
  submitDisabled = false,
  submitIcon,
  enableKeyboard = true,
}: NumpadProps) {
  useEffect(() => {
    if (!enableKeyboard) return
    function handle(event: KeyboardEvent) {
      if (event.key >= '0' && event.key <= '9') {
        onDigit(event.key)
      } else if (event.key === 'Backspace') {
        onBackspace()
      } else if (event.key === 'Enter' && onSubmit && !submitDisabled) {
        onSubmit()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [enableKeyboard, onDigit, onBackspace, onSubmit, submitDisabled])

  return (
    <div className="grid grid-cols-3 gap-3">
      {DIGITOS.map((d) => (
        <Tecla key={d} onClick={() => onDigit(d)}>
          {d}
        </Tecla>
      ))}

      <Tecla onClick={onBackspace} variant="ghost" aria-label="Borrar">
        <Backspace weight="regular" className="h-9 w-9" />
      </Tecla>

      <Tecla onClick={() => onDigit('0')}>0</Tecla>

      {onSubmit ? (
        <Tecla
          onClick={onSubmit}
          variant="primary"
          disabled={submitDisabled}
          aria-label="Confirmar"
        >
          {submitIcon ?? <Check weight="bold" className="h-9 w-9" />}
        </Tecla>
      ) : (
        <div aria-hidden />
      )}
    </div>
  )
}

interface TeclaProps {
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'ghost' | 'primary'
  disabled?: boolean
  'aria-label'?: string
}

function Tecla({ children, onClick, variant = 'default', disabled = false, ...rest }: TeclaProps) {
  const base =
    'flex h-[4.5rem] items-center justify-center rounded-2xl text-3xl font-medium font-mono tabular select-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
  const styles = {
    default: 'bg-zinc-50 border border-zinc-200 text-zinc-900 active:bg-zinc-100',
    ghost: 'bg-transparent text-zinc-500 active:bg-zinc-100',
    primary:
      'bg-emerald-500 text-emerald-950 active:bg-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]',
  }[variant]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : TAP}
      transition={SPRING}
      className={`${base} ${styles}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
