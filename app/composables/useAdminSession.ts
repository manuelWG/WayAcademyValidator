import type { AdminSession } from '../types/admin'
import { adminAuthRepository } from '../repositories/admin-auth.repository'
import { computeDashboardStats } from '../utils/dashboard-stats'
import { useMockStore } from './useMockStore'

export function useAdminSession() {
  const session = useState<AdminSession>('way-academy-validator-admin-session', () => ({
    authenticated: false,
    user: null
  }))

  const store = useMockStore()
  const dashboardStats = computed(() => computeDashboardStats(store.value))

  async function login(username: string, password: string) {
    const result = await adminAuthRepository.login(username, password)
    session.value = result
    return result
  }

  function logout() {
    session.value = { authenticated: false, user: null }
  }

  return {
    session,
    isAuthenticated: computed(() => session.value.authenticated),
    user: computed(() => session.value.user),
    login,
    logout,
    demoCredentials: adminAuthRepository.getDemoCredentials(),
    dashboardStats
  }
}
