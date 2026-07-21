import type { AdminSession } from '../types/admin'
import { adminAuthRepository, type AuthFetch } from '../repositories/admin-auth.repository'
import { refreshAdminSession } from '../utils/refresh-admin-session'
import { computeDashboardStats } from '../utils/dashboard-stats'
import { useMockStore } from './useMockStore'

export function useAdminSession() {
  // Capture while the composable still has an active Nuxt instance (middleware / setup).
  const nuxtApp = useNuxtApp()
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
  const { imports } = useImports()
  const { conflicts } = useAudit()
  const dashboardStats = computed(() => computeDashboardStats(store.value, imports.value, conflicts.value))

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
    // Capture before the first await so SSR cookies stay available after getSession().
    const requestFetch = useRequestFetch() as AuthFetch
    return refreshAdminSession({
      getSession: () => adminAuthRepository.getSession(requestFetch),
      // clear() calls useRequestFetch() internally — restore Nuxt context after await.
      clear: () => nuxtApp.runWithContext(() => clear())
    })
  }

  return {
    session,
    isAuthenticated: computed(() => session.value.authenticated),
    user: computed(() => session.value.user),
    login,
    logout,
    refreshSession,
    /** Certificate totals remain demo; import and audit metrics come from their real API state. */
    dashboardStats
  }
}
