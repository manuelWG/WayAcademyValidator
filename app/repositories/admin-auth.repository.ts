import type { AdminSession } from '../types/admin'

/**
 * Injectable fetcher for auth API calls.
 * Pass `useRequestFetch()` during SSR so cookies are forwarded.
 */
// Nitro/$fetch option typing varies between SSR requestFetch and client $fetch.
// Keep this intentionally loose so both can be injected without casting at call sites.
export type AuthFetch = (
  url: string,
  opts?: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  }
) => Promise<unknown>

type SessionResponse = {
  authenticated: boolean
  user: { id: string, username: string, displayName: string } | null
}

type LoginResponse = {
  user: { id: string, username: string, displayName: string }
}

async function defaultFetch(
  url: string,
  opts?: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  }
): Promise<unknown> {
  return await $fetch(url, opts as never)
}

export const adminAuthRepository = {
  async login(
    username: string,
    password: string,
    fetcher: AuthFetch = defaultFetch
  ): Promise<AdminSession & { bootstrap?: boolean }> {
    try {
      const data = await fetcher('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      }) as LoginResponse
      return {
        authenticated: true,
        user: {
          username: data.user.username,
          displayName: data.user.displayName
        }
      }
    } catch (error: unknown) {
      const status = getStatus(error)
      const code = getErrorCode(error)
      if (status === 503 || code === 'BOOTSTRAP_REQUIRED') {
        return { authenticated: false, user: null, bootstrap: true }
      }
      return { authenticated: false, user: null }
    }
  },

  async logout(fetcher: AuthFetch = defaultFetch): Promise<void> {
    try {
      await fetcher('/api/auth/logout', { method: 'POST' })
    } catch {
      // Fail closed on client: local clear still happens in the composable.
    }
  },

  /**
   * Fetch remote session. Pass `useRequestFetch()` during SSR so cookies are forwarded.
   */
  async getSession(fetcher: AuthFetch = defaultFetch): Promise<AdminSession> {
    try {
      const data = await fetcher('/api/auth/session') as SessionResponse
      if (!data.authenticated || !data.user) {
        return { authenticated: false, user: null }
      }
      return {
        authenticated: true,
        user: {
          username: data.user.username,
          displayName: data.user.displayName
        }
      }
    } catch {
      // Network/API failure → treat as unauthenticated (fail-closed).
      return { authenticated: false, user: null }
    }
  }
}

function getStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return (error as { statusCode: number }).statusCode
  }
  return undefined
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { code?: string, data?: { code?: string } } }).data
    return data?.code ?? data?.data?.code
  }
  return undefined
}
