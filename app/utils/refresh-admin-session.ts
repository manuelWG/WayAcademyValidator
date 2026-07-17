import type { AdminSession } from '../types/admin'
import { decideAdminRouteAccess, type AdminRouteDecision } from './admin-route-access'

/**
 * Production refresh flow used by useAdminSession / admin middleware.
 * Relies on a remote /api/auth/session check — never on the sealed cookie alone.
 *
 * When remote is valid, return it directly. Nuxt Auth Utils already hydrated the
 * sealed session via its server plugin; a second session fetch after await would
 * re-enter useRequestFetch() without an active Nuxt context during SSR.
 */
export async function refreshAdminSession(deps: {
  getSession: () => Promise<AdminSession>
  clear: () => void | Promise<void>
}): Promise<AdminSession> {
  const remote = await deps.getSession()
  if (!remote.authenticated) {
    await deps.clear()
    return remote
  }
  return remote
}

export function resolveAdminNavigation(
  path: string,
  remote: AdminSession
): AdminRouteDecision {
  return decideAdminRouteAccess({
    path,
    remoteAuthenticated: remote.authenticated
  })
}
