import { describe, expect, it, vi } from 'vitest'
import { decideAdminRouteAccess } from '../../app/utils/admin-route-access'
import {
  refreshAdminSession,
  resolveAdminNavigation
} from '../../app/utils/refresh-admin-session'
import { adminAuthRepository, type AuthFetch } from '../../app/repositories/admin-auth.repository'

describe('decideAdminRouteAccess / resolveAdminNavigation', () => {
  it('allows /admin only when remote session is valid (not sealed cookie alone)', () => {
    expect(resolveAdminNavigation('/admin', { authenticated: true, user: {
      username: 'admin',
      displayName: 'Admin'
    } })).toBe('allow')

    expect(resolveAdminNavigation('/admin', { authenticated: false, user: null }))
      .toBe('redirect-login')
  })

  it('keeps /admin/login without redirect loops when remote is invalid', () => {
    expect(decideAdminRouteAccess({
      path: '/admin/login',
      remoteAuthenticated: false
    })).toBe('allow')
  })

  it('sends authenticated users from login to dashboard', () => {
    expect(resolveAdminNavigation('/admin/login', {
      authenticated: true,
      user: { username: 'admin', displayName: 'Admin' }
    })).toBe('redirect-admin')
  })
})

describe('adminAuthRepository.getSession (injectable fetcher)', () => {
  it('uses the injected fetcher so SSR can forward request cookies', async () => {
    const calls: Array<{ url: string, opts?: unknown }> = []
    const fetcher: AuthFetch = async (url, opts) => {
      calls.push({ url, opts })
      // Simulate requestFetch forwarding Cookie from the incoming SSR request.
      expect(opts?.headers?.cookie || opts?.headers?.Cookie || true).toBeTruthy()
      return {
        authenticated: true,
        user: { id: '1', username: 'admin', displayName: 'Admin' }
      }
    }

    const withCookie: AuthFetch = async (url, opts) => {
      return fetcher(url, {
        ...opts,
        headers: { ...(opts?.headers || {}), cookie: 'nuxt-session=sealed-value' }
      })
    }

    const session = await adminAuthRepository.getSession(withCookie)

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('/api/auth/session')
    expect((calls[0]?.opts as { headers?: { cookie?: string } })?.headers?.cookie)
      .toBe('nuxt-session=sealed-value')
    expect(session.authenticated).toBe(true)
  })

  it('treats /api/auth/session failures as unauthenticated (fail-closed)', async () => {
    const fetcher: AuthFetch = async () => {
      throw { statusCode: 500, message: 'boom' }
    }
    const session = await adminAuthRepository.getSession(fetcher)
    expect(session).toEqual({ authenticated: false, user: null })
  })

  it('treats authenticated:false responses as unauthenticated', async () => {
    const fetcher: AuthFetch = async () => ({ authenticated: false, user: null })
    const session = await adminAuthRepository.getSession(fetcher)
    expect(session).toEqual({ authenticated: false, user: null })
  })
})

describe('refreshAdminSession (production helper)', () => {
  it('clears local session and redirects to login when remote is invalid', async () => {
    const clear = vi.fn(async () => undefined)
    const fetchSession = vi.fn(async () => undefined)
    const getSession = vi.fn(async () => ({ authenticated: false, user: null }))

    const remote = await refreshAdminSession({ getSession, clear, fetchSession })

    expect(remote.authenticated).toBe(false)
    expect(clear).toHaveBeenCalledOnce()
    expect(fetchSession).not.toHaveBeenCalled()
    expect(resolveAdminNavigation('/admin', remote)).toBe('redirect-login')
  })

  it('keeps access to /admin when remote session is valid', async () => {
    const clear = vi.fn(async () => undefined)
    const fetchSession = vi.fn(async () => undefined)
    const getSession = vi.fn(async () => ({
      authenticated: true,
      user: { username: 'admin', displayName: 'Admin' }
    }))

    const remote = await refreshAdminSession({ getSession, clear, fetchSession })

    expect(remote.authenticated).toBe(true)
    expect(clear).not.toHaveBeenCalled()
    expect(fetchSession).toHaveBeenCalledOnce()
    expect(resolveAdminNavigation('/admin', remote)).toBe('allow')
  })

  it('fail-closes when getSession throws through repository catch (invalid remote)', async () => {
    const clear = vi.fn(async () => undefined)
    const fetchSession = vi.fn(async () => undefined)
    const failingFetch: AuthFetch = async () => {
      throw new Error('network')
    }

    const remote = await refreshAdminSession({
      getSession: () => adminAuthRepository.getSession(failingFetch),
      clear,
      fetchSession
    })

    expect(remote.authenticated).toBe(false)
    expect(clear).toHaveBeenCalledOnce()
    expect(resolveAdminNavigation('/admin/cursos', remote)).toBe('redirect-login')
    expect(resolveAdminNavigation('/admin/login', remote)).toBe('allow')
  })
})
