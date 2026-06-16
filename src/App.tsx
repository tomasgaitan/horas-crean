import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DniEntry from './components/DniEntry'
import ConfirmacionFichaje from './components/ConfirmacionFichaje'
import FichajeOverlay from './components/FichajeOverlay'
import ModalInconsistencia from './components/ModalInconsistencia'
import PinGate from './components/PinGate'
import AltaProfesional from './components/AltaProfesional'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorScreen from './components/ErrorScreen'
import { ahora } from './lib/dayjs'
import { DEFAULT_PIN, FORMATO_FECHA, FORMATO_HORA, MINUTE_STEP } from './lib/constants'
import {
  altaProfesional,
  ApiError,
  getEstado,
  getProfesionales,
  registrarEgreso,
  registrarIngreso,
} from './services/api'
import { resolverAccion } from './lib/fichaje'
import type { ProfesionalLista } from './services/api'
import type { Profesional, TipoFichaje } from './types'

type Screen =
  | { name: 'dni'; error: string | null }
  | { name: 'inconsistencia'; profesional: Profesional; fecha: string; horaIngreso: string }
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
  | { name: 'error'; mensaje: string }

const DNI_NO_REGISTRADO = 'DNI no registrado'

function fechaHoy(): string {
  return ahora().format(FORMATO_FECHA)
}

/** Hora actual redondeada al múltiplo de MINUTE_STEP más cercano, en formato HH:mm. */
function horaPropuesta(): string {
  const n = ahora()
  const redondeado = Math.round(n.minute() / MINUTE_STEP) * MINUTE_STEP
  return n.minute(0).second(0).add(redondeado, 'minute').format(FORMATO_HORA)
}

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'dni', error: null })
  const [busy, setBusy] = useState(false)
  const [pin] = useState(DEFAULT_PIN)
  const [profesionales, setProfesionales] = useState<ProfesionalLista[]>([])
  const [profesionalesCargando, setProfesionalesCargando] = useState(false)

  const irAInicio = () => setScreen({ name: 'dni', error: null })

  /** Construye el objeto Profesional combinando el DNI ingresado con la respuesta del backend. */
  function rutearAccion(profesional: Profesional, abierta: Parameters<typeof resolverAccion>[0]) {
    const accion = resolverAccion(abierta, fechaHoy())
    if (accion.tipo === 'inconsistencia') {
      setScreen({ name: 'inconsistencia', profesional, fecha: accion.fecha, horaIngreso: accion.horaIngreso })
    } else if (accion.tipo === 'egreso') {
      setScreen({
        name: 'confirmacion',
        profesional,
        tipo: 'egreso',
        horaInicial: horaPropuesta(),
        horaIngresoAbierto: accion.horaIngreso,
      })
    } else {
      setScreen({
        name: 'confirmacion',
        profesional,
        tipo: 'ingreso',
        horaInicial: horaPropuesta(),
        horaIngresoAbierto: null,
      })
    }
  }

  async function handleDniSubmit(dni: string) {
    setBusy(true)
    try {
      const estado = await getEstado(dni)
      if (!estado.profesional || !estado.profesional.activo) {
        setScreen({ name: 'dni', error: DNI_NO_REGISTRADO })
        return
      }
      const profesional: Profesional = {
        dni,
        nombre: estado.profesional.nombre,
        apellido: estado.profesional.apellido,
        activo: estado.profesional.activo,
      }
      rutearAccion(profesional, estado.abierta)
    } catch (error) {
      setScreen({ name: 'error', mensaje: mensajeDe(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmFichaje(hora: string) {
    if (screen.name !== 'confirmacion') return
    const { profesional, tipo } = screen
    setBusy(true)
    try {
      if (tipo === 'ingreso') {
        await registrarIngreso({
          dni: profesional.dni,
          profesional: `${profesional.nombre} ${profesional.apellido}`,
          fecha: fechaHoy(),
          hora,
        })
      } else {
        await registrarEgreso(profesional.dni, hora)
      }
      setScreen({ name: 'overlay', profesional, tipo, hora })
    } catch (error) {
      setScreen({ name: 'error', mensaje: mensajeDe(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleResolverInconsistencia(hora: string) {
    if (screen.name !== 'inconsistencia') return
    const { profesional } = screen
    setBusy(true)
    try {
      await registrarEgreso(profesional.dni, hora) // cierra la sesión abierta pasada
      const estado = await getEstado(profesional.dni) // re-evalúa para continuar con hoy
      rutearAccion(profesional, estado.abierta)
    } catch (error) {
      setScreen({ name: 'error', mensaje: mensajeDe(error) })
    } finally {
      setBusy(false)
    }
  }

  async function cargarProfesionales() {
    setProfesionalesCargando(true)
    try {
      setProfesionales(await getProfesionales())
    } catch {
      setProfesionales([])
    } finally {
      setProfesionalesCargando(false)
    }
  }

  function entrarAdmin() {
    setScreen({ name: 'admin' })
    void cargarProfesionales()
  }

  /** Da de alta y refresca la lista. Propaga el error del backend a la pantalla de alta. */
  async function handleAddProfesional(datos: { dni: string; nombre: string; apellido: string }) {
    await altaProfesional(datos)
    await cargarProfesionales()
  }

  return (
    <>
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
              lookupError={screen.error}
            />
          )}

          {screen.name === 'inconsistencia' && (
            <ModalInconsistencia
              profesional={screen.profesional}
              fecha={screen.fecha}
              horaIngreso={screen.horaIngreso}
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
            <PinGate expectedPin={pin} onSuccess={entrarAdmin} onCancel={irAInicio} />
          )}

          {screen.name === 'admin' && (
            <AltaProfesional
              profesionales={profesionales}
              cargando={profesionalesCargando}
              onAdd={handleAddProfesional}
              onBack={irAInicio}
            />
          )}

          {screen.name === 'error' && (
            <ErrorScreen mensaje={screen.mensaje} onRetry={irAInicio} />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{busy && <LoadingOverlay />}</AnimatePresence>
    </>
  )
}
