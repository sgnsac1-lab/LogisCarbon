import { getSessionUser } from '@/actions/session.actions'
import type { Rol } from '@/types'

type UsuarioActivo = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>

export type ResultadoAutorizacion =
  | { ok: true; usuario: UsuarioActivo }
  | { ok: false; error: string }

const ERROR_PERMISOS = 'No tiene permisos para realizar esta acción.'

export async function requireActiveUser(): Promise<ResultadoAutorizacion> {
  const usuario = await getSessionUser()

  if (!usuario || usuario.activo !== true) {
    return { ok: false, error: ERROR_PERMISOS }
  }

  return { ok: true, usuario }
}

export async function requireRole(...roles: Rol[]): Promise<ResultadoAutorizacion> {
  const resultado = await requireActiveUser()

  if (!resultado.ok) {
    return resultado
  }

  if (!roles.includes(resultado.usuario.rol as Rol)) {
    return { ok: false, error: ERROR_PERMISOS }
  }

  return resultado
}
