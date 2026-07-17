import type { AdminSession } from '../types/admin'
import { adminAuthRepository, type AuthFetch } from '../repositories/admin-auth.repository'
import { refreshAdminSession } from '../utils/refresh-admin-session'
import { computeDashboardStats } from '../utils/dashboard-stats'
import { useMockStore } from './useMockStore'

export function useAdminSession() {
  const { user: sessionUser, clear, fetch: fetchSession } = useUserSession()

  const session = computed<AdminSession>(() => ({
    authenticated: Boolean(sessionUser.value),
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

  /**
   * Revalidate against Neon via GET /api/auth/session.
   * During SSR, useRequestFetch() forwards the incoming Cookie header.
   * A sealed cookie alone is not enough: invalid/inactive admins clear the local session.
   */
  async function refreshSession() {
    // useRequestFetch forwards incoming Cookie during SSR; on client it is $fetch.
    const requestFetch = useRequestFetch() as AuthFetch
    return refreshAdminSession({
      getSession: () => adminAuthRepository.getSession(requestFetch),
      clear,
      fetchSession
    })
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
