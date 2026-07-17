import { beforeAll, describe, expect, it } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { resolveAdminNavigation } from '../../app/utils/refresh-admin-session'

/**
 * Focused Nuxt-environment coverage for the SSR session refresh path.
 * Exercises the real useAdminSession composable (and thus nuxt-auth-utils clear /
 * useRequestFetch) rather than only pure helper callbacks.
 */
describe('useAdminSession refreshSession (nuxt SSR context)', () => {
  beforeAll(() => {
    registerEndpoint('/api/_auth/session', {
      method: 'DELETE',
      handler: () => null
    })
  })

  it('returns a valid remote session without throwing after await (direct /admin reload)', async () => {
    const dispose = registerEndpoint('/api/auth/session', {
      once: true,
      handler: () => ({
        authenticated: true,
        user: { id: '1', username: 'admin', displayName: 'Admin' }
      })
    })

    try {
      const { refreshSession } = useAdminSession()
      const remote = await refreshSession()

      expect(remote.authenticated).toBe(true)
      expect(remote.user?.username).toBe('admin')
      expect(resolveAdminNavigation('/admin', remote)).toBe('allow')
    } finally {
      dispose()
    }
  })

  it('clears an invalid remote session inside Nuxt context (useRequestFetch via clear)', async () => {
    const disposeSession = registerEndpoint('/api/auth/session', {
      once: true,
      handler: () => ({ authenticated: false, user: null })
    })

    try {
      const { refreshSession } = useAdminSession()
      // Old bug: clear() → useRequestFetch() after await lost Nuxt context during SSR.
      await expect(refreshSession()).resolves.toEqual({ authenticated: false, user: null })
      expect(resolveAdminNavigation('/admin', { authenticated: false, user: null }))
        .toBe('redirect-login')
      expect(resolveAdminNavigation('/admin/login', { authenticated: false, user: null }))
        .toBe('allow')
    } finally {
      disposeSession()
    }
  })

  it('fail-closes when /api/auth/session errors and clears via Nuxt context', async () => {
    const disposeSession = registerEndpoint('/api/auth/session', {
      once: true,
      handler: () => {
        throw createError({ statusCode: 500, message: 'session unavailable' })
      }
    })

    try {
      const { refreshSession } = useAdminSession()
      const remote = await refreshSession()

      expect(remote).toEqual({ authenticated: false, user: null })
      expect(resolveAdminNavigation('/admin', remote)).toBe('redirect-login')
      expect(resolveAdminNavigation('/admin/login', remote)).toBe('allow')
    } finally {
      disposeSession()
    }
  })

  it('uses useRequestFetch so the remote session check runs in Nuxt SSR context', async () => {
    let hitAuthSession = false
    const dispose = registerEndpoint('/api/auth/session', {
      once: true,
      handler: () => {
        hitAuthSession = true
        return {
          authenticated: true,
          user: { id: '1', username: 'admin', displayName: 'Admin' }
        }
      }
    })

    try {
      const { refreshSession } = useAdminSession()
      const remote = await refreshSession()

      expect(hitAuthSession).toBe(true)
      expect(remote.authenticated).toBe(true)
      expect(resolveAdminNavigation('/admin', remote)).toBe('allow')
    } finally {
      dispose()
    }
  })
})
