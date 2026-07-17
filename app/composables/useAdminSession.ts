import type { AdminSession } from '../types/admin'
import { adminAuthRepository } from '../repositories/admin-auth.repository'
import { computeDashboardStats } from '../utils/dashboard-stats'
import { useMockStore } from './useMockStore'

export function useAdminSession() {
  const { loggedIn, user: sessionUser, clear, fetch: fetchSession } = useUserSession()

  const session = computed<AdminSession>(() => ({
    authenticated: Boolean(loggedIn.value && sessionUser.value),
    user: sessionUser.value
      ? {
          username: sessionUser.value.username,
          displayName: sessionUser.value.displayName
        }
      : null
  }))

  const store = useMockStore()
  const demoDashboardStats = computed(() => computeDashboardStats(store.value))

  async function login(username: string, password: string) {
    const result = await adminAuthRepository.login(username, password)
    if (result.authenticated) {
      await fetchSession()
    }
    return result
  }

  async function logout() {
    await adminAuthRepository.logout()
    await clear()
  }

  async function refreshSession() {
    await fetchSession()
    // Server /api/auth/session clears invalid cookies; re-fetch sealed session
    const remote = await adminAuthRepository.getSession()
    if (!remote.authenticated) {
      await clear()
    }
    return remote
  }

  return {
    session,
    isAuthenticated: computed(() => session.value.authenticated),
    user: computed(() => session.value.user),
    login,
    logout,
    refreshSession,
    /** Demo metrics still sourced from mock store (certificates/imports/audit). */
    demoDashboardStats
  }
}
