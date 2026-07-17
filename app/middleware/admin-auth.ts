import { resolveAdminNavigation } from '../utils/refresh-admin-session'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) {
    return
  }

  const { refreshSession } = useAdminSession()
  const remote = await refreshSession()
  const decision = resolveAdminNavigation(to.path, remote)

  if (decision === 'redirect-login') {
    return navigateTo('/admin/login')
  }

  if (decision === 'redirect-admin') {
    return navigateTo('/admin')
  }
})
