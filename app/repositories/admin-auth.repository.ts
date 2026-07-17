import type { AdminSession } from '../types/admin'

type SessionResponse = {
  authenticated: boolean
  user: { id: string, username: string, displayName: string } | null
}

type LoginResponse = {
  user: { id: string, username: string, displayName: string }
}

export const adminAuthRepository = {
  async login(username: string, password: string): Promise<AdminSession & { bootstrap?: boolean }> {
    try {
      const data = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
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

  async logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
  },

  async getSession(): Promise<AdminSession> {
    try {
      const data = await $fetch<SessionResponse>('/api/auth/session')
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
