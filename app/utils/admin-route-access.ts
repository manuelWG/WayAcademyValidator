export type AdminRouteDecision = 'allow' | 'redirect-login' | 'redirect-admin'

/**
 * Decide admin route access from the *remote* session check (/api/auth/session),
 * not from a sealed cookie alone.
 */
export function decideAdminRouteAccess(options: {
  path: string
  remoteAuthenticated: boolean
}): AdminRouteDecision {
  const { path, remoteAuthenticated } = options
  if (!path.startsWith('/admin')) {
    return 'allow'
  }

  const isLogin = path === '/admin/login'

  if (!isLogin && !remoteAuthenticated) {
    return 'redirect-login'
  }

  if (isLogin && remoteAuthenticated) {
    return 'redirect-admin'
  }

  return 'allow'
}
