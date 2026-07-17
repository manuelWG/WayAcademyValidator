import { decideAdminRouteAccess } from '../utils/admin-route-access'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) {
    return
  }

  const { refreshSession } = useAdminSession()
  const remote = await refreshSession()

  const decision = decideAdminRouteAccess({
    path: to.path,
    remoteAuthenticated: remote.authenticated
  })

  if (decision === 'redirect-login') {
    return navigateTo('/admin/login')
  }

  if (decision === 'redirect-admin') {
    return navigateTo('/admin')
  }
})
