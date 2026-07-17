import { describe, expect, it, vi } from 'vitest'
import { decideAdminRouteAccess } from '../../app/utils/admin-route-access'

describe('decideAdminRouteAccess', () => {
  it('blocks admin pages when remote revalidation says unauthenticated', () => {
    // Sealed cookie may still exist locally; remote Neon check is authoritative.
    expect(decideAdminRouteAccess({
      path: '/admin',
      remoteAuthenticated: false
    })).toBe('redirect-login')

    expect(decideAdminRouteAccess({
      path: '/admin/cursos',
      remoteAuthenticated: false
    })).toBe('redirect-login')
  })

  it('allows login page when remote session is invalid (no redirect loop)', () => {
    expect(decideAdminRouteAccess({
      path: '/admin/login',
      remoteAuthenticated: false
    })).toBe('allow')
  })

  it('redirects authenticated users away from login', () => {
    expect(decideAdminRouteAccess({
      path: '/admin/login',
      remoteAuthenticated: true
    })).toBe('redirect-admin')
  })

  it('allows admin pages only when remote session is valid', () => {
    expect(decideAdminRouteAccess({
      path: '/admin/cursos/nuevo',
      remoteAuthenticated: true
    })).toBe('allow')
  })
})

describe('refreshSession remote invalidation contract', () => {
  it('clears local session when /api/auth/session returns unauthenticated', async () => {
    const clear = vi.fn(async () => undefined)
    const fetchSession = vi.fn(async () => undefined)
    const getSession = vi.fn(async () => ({ authenticated: false, user: null }))

    async function refreshSession() {
      const remote = await getSession()
      if (!remote.authenticated) {
        await clear()
        return remote
      }
      await fetchSession()
      return remote
    }

    const remote = await refreshSession()

    expect(remote.authenticated).toBe(false)
    expect(clear).toHaveBeenCalledOnce()
    expect(fetchSession).not.toHaveBeenCalled()
    expect(decideAdminRouteAccess({
      path: '/admin',
      remoteAuthenticated: remote.authenticated
    })).toBe('redirect-login')
  })
})
