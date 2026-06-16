import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DniEntry from './components/DniEntry'
import ConfirmacionFichaje from './components/ConfirmacionFichaje'
import FichajeOverlay from './components/FichajeOverlay'
import ModalInconsistencia from './components/ModalInconsistencia'
import PinGate from './components/PinGate'
import AltaProfesional from './components/AltaProfesional'
import { ahora } from './lib/dayjs'
import { FORMATO_FECHA, FORMATO_HORA, MINUTE_STEP } from './lib/constants'
import {
  addFichaje,
  addProfesional,
  getConfig,
  getFichajesDe,
  getProfesionales,
} from './lib/storage'
import {
  crearFichaje,
  detectarInconsistencia,
  detectarProximoTipo,
  getIngresoAbierto,
} from './lib/fichaje'
import type { Fichaje, Profesional, TipoFichaje } from './types'

type Screen =
  | { name: 'dni'; lookupError: string | null }
  | { name: 'inconsistencia'; profesional: Profesional; ingresoAbierto: Fichaje }
  | {
      name: 'confirmacion'
      profesional: Profesional
      tipo: TipoFichaje
      horaInicial: string
      horaIngresoAbierto: string | null
    }
  | { name: 'overlay'; profesional: Profesional; tipo: TipoFichaje; hora: string }
  | { name: 'pin' }
  | { name: 'admin' }

const DNI_NO_REGISTRADO = 'DNI no registrado'

/** Hora actual redondeada al múltiplo de MINUTE_STEP más cercano, en formato HH:mm. */
function horaPropuesta(): string {
  const n = ahora()
  const redondeado = Math.round(n.minute() / MINUTE_STEP) * MINUTE_STEP
  return n.minute(0).second(0).add(redondeado, 'minute').format(FORMATO_HORA)
}

/** Genera un id único, con fallback para entornos sin crypto.randomUUID. */
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${ahora().valueOf()}-${Math.round(performance.now())}`
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'dni', lookupError: null })
  const [profesionales, setProfesionales] = useState<Profesional[]>(() => getProfesionales())
  const [pin] = useState(() => getConfig().pin)

  const irAInicio = () => setScreen({ name: 'dni', lookupError: null })

  /** Tras identificar al profesional: detecta inconsistencia o resuelve el tipo. */
  function procederFichaje(profesional: Profesional) {
    const fichajes = getFichajesDe(profesional.dni)
    const hoy = ahora().format(FORMATO_FECHA)

    const inconsistencia = detectarInconsistencia(fichajes, hoy)
    if (inconsistencia) {
      setScreen({ name: 'inconsistencia', profesional, ingresoAbierto: inconsistencia })
      return
    }

    const tipo = detectarProximoTipo(fichajes)
    const horaIngresoAbierto = tipo === 'egreso' ? (getIngresoAbierto(fichajes)?.hora ?? null) : null
    setScreen({
      name: 'confirmacion',
      profesional,
      tipo,
      horaInicial: horaPropuesta(),
      horaIngresoAbierto,
    })
  }

  function handleDniSubmit(dni: string) {
    const profesional = profesionales.find((p) => p.dni === dni && p.activo)
    if (!profesional) {
      setScreen({ name: 'dni', lookupError: DNI_NO_REGISTRADO })
      return
    }
    procederFichaje(profesional)
  }

  function handleConfirmFichaje(hora: string) {
    if (screen.name !== 'confirmacion') return
    const { profesional, tipo } = screen
    const fichaje = crearFichaje(
      profesional,
      tipo,
      ahora().format(FORMATO_FECHA),
      hora,
      ahora().toISOString(),
      genId(),
    )
    addFichaje(fichaje)
    setScreen({ name: 'overlay', profesional, tipo, hora })
  }

  function handleResolverInconsistencia(hora: string) {
    if (screen.name !== 'inconsistencia') return
    const { profesional, ingresoAbierto } = screen
    const egreso = crearFichaje(
      profesional,
      'egreso',
      ingresoAbierto.fecha,
      hora,
      ahora().toISOString(),
      genId(),
    )
    addFichaje(egreso)
    // Resuelta la inconsistencia, se continúa con el fichaje de hoy.
    procederFichaje(profesional)
  }

  function handleAddProfesional(profesional: Profesional) {
    addProfesional(profesional)
    setProfesionales(getProfesionales())
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen.name}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {screen.name === 'dni' && (
          <DniEntry
            onSubmit={handleDniSubmit}
            onAdmin={() => setScreen({ name: 'pin' })}
            lookupError={screen.lookupError}
          />
        )}

        {screen.name === 'inconsistencia' && (
          <ModalInconsistencia
            profesional={screen.profesional}
            ingresoAbierto={screen.ingresoAbierto}
            onConfirm={handleResolverInconsistencia}
            onCancel={irAInicio}
          />
        )}

        {screen.name === 'confirmacion' && (
          <ConfirmacionFichaje
            profesional={screen.profesional}
            tipo={screen.tipo}
            horaInicial={screen.horaInicial}
            horaIngresoAbierto={screen.horaIngresoAbierto}
            onConfirm={handleConfirmFichaje}
            onCancel={irAInicio}
          />
        )}

        {screen.name === 'overlay' && (
          <FichajeOverlay
            tipo={screen.tipo}
            profesional={screen.profesional}
            hora={screen.hora}
            onDone={irAInicio}
          />
        )}

        {screen.name === 'pin' && (
          <PinGate
            expectedPin={pin}
            onSuccess={() => setScreen({ name: 'admin' })}
            onCancel={irAInicio}
          />
        )}

        {screen.name === 'admin' && (
          <AltaProfesional
            profesionales={profesionales}
            onAdd={handleAddProfesional}
            onBack={irAInicio}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
