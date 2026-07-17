import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb } from '../database/client'
import { adminUsers } from '../database/schema'

export type ActiveAdmin = {
  id: string
  username: string
  displayName: string
}

const UNAUTHORIZED = {
  statusCode: 401,
  statusMessage: 'Unauthorized',
  message: 'Credenciales inválidas'
} as const

/**
 * Require a sealed session and re-validate the admin against Neon.
 * Clears the session when the user is missing or inactive (no reason leaked).
 */
export async function requireActiveAdmin(event: H3Event): Promise<ActiveAdmin> {
  const session = await requireUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    await clearUserSession(event)
    throw createError(UNAUTHORIZED)
  }

  const database = useDb()
  const [row] = await database
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      displayName: adminUsers.displayName,
      isActive: adminUsers.isActive
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1)

  if (!row || !row.isActive) {
    await clearUserSession(event)
    throw createError(UNAUTHORIZED)
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName
  }
}
