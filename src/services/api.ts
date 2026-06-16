// Capa de acceso al backend (Google Apps Script sobre Sheets).
// Única frontera con la red: el resto de la app no conoce el transporte.
// Todo por GET (request "simple") para evitar preflight/CORS de Apps Script.

const BASE_URL = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim()

/** Error específico de la capa de API para propagación tipada. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Sesión abierta de un profesional (fila con egreso vacío). */
export interface SesionAbierta {
  fecha: string
  horaIngreso: string
}

/** Respuesta de la acción `estado`. */
export interface Estado {
  profesional: { nombre: string; apellido: string; activo: boolean } | null
  abierta: SesionAbierta | null
}

/** Profesional tal como lo lista el backend (sin el flag activo). */
export interface ProfesionalLista {
  dni: string
  nombre: string
  apellido: string
}

interface RespuestaBase {
  ok: boolean
  error?: string
}

async function call<T>(params: Record<string, string>): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError('Falta configurar VITE_APPS_SCRIPT_URL')
  }

  const url = new URL(BASE_URL)
  for (const [clave, valor] of Object.entries(params)) {
    url.searchParams.set(clave, valor)
  }

  let response: Response
  try {
    response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' })
  } catch (error) {
    throw new ApiError('No se pudo conectar con el servidor', error)
  }

  if (!response.ok) {
    throw new ApiError(`El servidor respondió con error (${response.status})`)
  }

  let body: RespuestaBase & Record<string, unknown>
  try {
    body = await response.json()
  } catch (error) {
    throw new ApiError('Respuesta inválida del servidor', error)
  }

  if (!body || body.ok === false) {
    throw new ApiError(body?.error ?? 'Error desconocido del servidor')
  }

  return body as unknown as T
}

/** Estado de un DNI: profesional (o null si no existe) y sesión abierta. */
export function getEstado(dni: string): Promise<Estado> {
  return call<Estado>({ action: 'estado', dni })
}

/** Registra un ingreso (crea una fila nueva con egreso vacío). */
export async function registrarIngreso(args: {
  dni: string
  profesional: string
  fecha: string
  hora: string
}): Promise<void> {
  await call({ action: 'ingreso', ...args })
}

/** Completa el egreso de la sesión abierta del DNI. */
export async function registrarEgreso(dni: string, hora: string): Promise<void> {
  await call({ action: 'egreso', dni, hora })
}

/** Da de alta un profesional (el backend rechaza DNI duplicado). */
export async function altaProfesional(args: {
  dni: string
  nombre: string
  apellido: string
}): Promise<void> {
  await call({ action: 'alta', ...args })
}

/** Lista de profesionales activos. */
export async function getProfesionales(): Promise<ProfesionalLista[]> {
  const data = await call<{ profesionales: ProfesionalLista[] }>({ action: 'profesionales' })
  return data.profesionales ?? []
}
