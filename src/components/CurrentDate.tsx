import { useEffect, useState } from 'react'
import { ahora } from '../lib/dayjs'

const TICK_MS = 30_000

/**
 * Fecha actual (sin hora). Se actualiza periódicamente para reflejar el cambio
 * de día a la medianoche sin necesidad de recargar el kiosco.
 */
export default function CurrentDate() {
  const [now, setNow] = useState(() => ahora())

  useEffect(() => {
    const id = window.setInterval(() => setNow(ahora()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const fecha = capitalizar(now.format('dddd D [de] MMMM'))
  const anio = now.format('YYYY')

  return (
    <div className="flex flex-col">
      <span className="text-5xl font-semibold tracking-tight text-zinc-900">{fecha}</span>
      <span className="mt-2 text-xl font-light tracking-wide text-zinc-400">{anio}</span>
    </div>
  )
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
