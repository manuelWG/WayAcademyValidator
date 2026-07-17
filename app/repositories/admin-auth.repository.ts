import type { AdminSession } from '../types/admin'
import { delay } from '../utils/delay'

const DEMO_USER = 'admin'
const DEMO_PASSWORD = 'demo1234'

export const adminAuthRepository = {
  async login(username: string, password: string): Promise<AdminSession> {
    await delay(600)
    if (username.trim() === DEMO_USER && password === DEMO_PASSWORD) {
      return {
        authenticated: true,
        user: { username: DEMO_USER, displayName: 'Administrador demo' }
      }
    }
    return { authenticated: false, user: null }
  },

  getDemoCredentials() {
    return { username: DEMO_USER, password: DEMO_PASSWORD }
  }
}
