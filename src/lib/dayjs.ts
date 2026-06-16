// Configuración global de dayjs: timezone Argentina como zona por defecto.
// Importar este módulo una sola vez (en main.tsx) basta para activar los plugins.
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/es'

import { TIMEZONE } from './constants'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.locale('es')
dayjs.tz.setDefault(TIMEZONE)

/** Momento actual en zona horaria AR. */
export function ahora() {
  return dayjs().tz(TIMEZONE)
}

export default dayjs
