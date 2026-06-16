import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, UserPlus, Warning } from '@phosphor-icons/react'
import { validarProfesionalNuevo } from '../lib/fichaje'
import { DNI_MAX_LENGTH, NOMBRE_MAX_LENGTH } from '../lib/constants'
import type { Profesional } from '../types'

interface AltaProfesionalProps {
  profesionales: Profesional[]
  onAdd: (profesional: Profesional) => void
  onBack: () => void
}

export default function AltaProfesional({ profesionales, onAdd, onBack }: AltaProfesionalProps) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const activos = profesionales.filter((p) => p.activo)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const yaExiste = profesionales.some((p) => p.dni === dni.trim())
    const validacion = validarProfesionalNuevo(nombre, apellido, dni.trim(), yaExiste)
    if (!validacion.ok) {
      setError(validacion.error ?? 'Datos inválidos')
      setExito(null)
      return
    }

    const nuevo: Profesional = {
      dni: dni.trim(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      activo: true,
    }
    onAdd(nuevo)
    setExito(`${nuevo.nombre} ${nuevo.apellido} agregado`)
    setError(null)
    setNombre('')
    setApellido('')
    setDni('')
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-8 p-8 md:p-12">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-600 active:bg-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al kiosco
        </button>
        <span className="text-sm text-zinc-500">{activos.length} profesionales activos</span>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <UserPlus weight="bold" className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Agregar profesional</h1>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="nombre" className="text-sm font-medium text-zinc-600">
            Nombre
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoCapitalize="words"
            autoComplete="off"
            maxLength={NOMBRE_MAX_LENGTH}
            className={INPUT_CLASS}
            placeholder="Bernabé"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="apellido" className="text-sm font-medium text-zinc-600">
            Apellido
          </label>
          <input
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            autoCapitalize="words"
            autoComplete="off"
            maxLength={NOMBRE_MAX_LENGTH}
            className={INPUT_CLASS}
            placeholder="Quiroga"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="dni" className="text-sm font-medium text-zinc-600">
            DNI
          </label>
          <input
            id="dni"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, DNI_MAX_LENGTH))}
            inputMode="numeric"
            autoComplete="off"
            className={`${INPUT_CLASS} font-mono tabular tracking-widest`}
            placeholder="41188294"
          />
        </div>

        <div className="min-h-[1.5rem]">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={`err-${error}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm text-rose-600"
              >
                <Warning weight="fill" className="h-4 w-4" />
                {error}
              </motion.p>
            )}
            {exito && !error && (
              <motion.p
                key={`ok-${exito}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm text-emerald-600"
              >
                <CheckCircle weight="fill" className="h-4 w-4" />
                {exito}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98, y: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:brightness-95"
        >
          <UserPlus weight="bold" className="h-5 w-5" />
          Agregar
        </motion.button>
      </form>

      <ListaProfesionales profesionales={activos} />
    </div>
  )
}

const INPUT_CLASS =
  'h-14 rounded-2xl border border-zinc-200 bg-white px-4 text-xl text-zinc-900 placeholder:text-zinc-300 outline-none transition-colors focus:border-emerald-500'

function ListaProfesionales({ profesionales }: { profesionales: Profesional[] }) {
  if (profesionales.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        Todavía no hay profesionales cargados. Agregá el primero arriba.
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <p className="mb-2 text-sm font-medium text-zinc-500">Profesionales activos</p>
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200">
        {profesionales.map((p) => (
          <li key={p.dni} className="flex items-center justify-between px-4 py-3">
            <span className="text-zinc-800">
              {p.nombre} {p.apellido}
            </span>
            <span className="font-mono tabular text-sm text-zinc-500">{p.dni}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
