import { count, eq } from 'drizzle-orm'
import {
  displayNameSchema,
  loginBodySchema,
  normalizedUsernameSchema
} from '../../shared/schemas/auth'
import { useDb } from '../database/client'
import { adminUsers } from '../database/schema'
import {
  hashAdminPassword,
  passwordPolicyMessage,
  validatePasswordPolicy,
  verifyAdminPassword,
  verifyPasswordAgainstDummy
} from '../utils/password'

export type PublicAdminUser = {
  id: string
  username: string
  displayName: string
}

export async function countAdmins(): Promise<number> {
  const database = useDb()
  const [row] = await database.select({ value: count() }).from(adminUsers)
  return Number(row?.value ?? 0)
}

export async function findAdminByUsername(username: string) {
  const database = useDb()
  const [row] = await database
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1)
  return row ?? null
}

export async function findAdminById(id: string) {
  const database = useDb()
  const [row] = await database
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1)
  return row ?? null
}

export async function authenticateAdmin(
  rawUsername: string,
  password: string
): Promise<{ ok: true, user: PublicAdminUser } | { ok: false, reason: 'invalid' | 'bootstrap' }> {
  const total = await countAdmins()
  if (total === 0) {
    return { ok: false, reason: 'bootstrap' }
  }

  let username: string
  try {
    username = normalizedUsernameSchema.parse(rawUsername)
  } catch {
    await verifyPasswordAgainstDummy(password)
    return { ok: false, reason: 'invalid' }
  }

  const admin = await findAdminByUsername(username)

  if (!admin) {
    await verifyPasswordAgainstDummy(password)
    return { ok: false, reason: 'invalid' }
  }

  const match = await verifyAdminPassword(password, admin.passwordHash)
  if (!match || !admin.isActive) {
    return { ok: false, reason: 'invalid' }
  }

  const database = useDb()
  const now = new Date()
  await database
    .update(adminUsers)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(adminUsers.id, admin.id))

  return {
    ok: true,
    user: {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName
    }
  }
}

export async function revalidateSessionUser(
  userId: string | undefined
): Promise<PublicAdminUser | null> {
  if (!userId) return null
  const admin = await findAdminById(userId)
  if (!admin || !admin.isActive) return null
  return {
    id: admin.id,
    username: admin.username,
    displayName: admin.displayName
  }
}

export async function createAdminUser(input: {
  username: string
  displayName: string
  password: string
}): Promise<PublicAdminUser> {
  const username = normalizedUsernameSchema.parse(input.username)
  const displayName = displayNameSchema.parse(input.displayName)

  const policyError = validatePasswordPolicy(input.password)
  if (policyError) {
    throw new Error(passwordPolicyMessage(policyError))
  }

  const existing = await findAdminByUsername(username)
  if (existing) {
    throw new Error('USERNAME_TAKEN')
  }

  const passwordHash = await hashAdminPassword(input.password)
  const database = useDb()
  const [created] = await database
    .insert(adminUsers)
    .values({
      username,
      displayName,
      passwordHash
    })
    .returning({
      id: adminUsers.id,
      username: adminUsers.username,
      displayName: adminUsers.displayName
    })

  if (!created) {
    throw new Error('CREATE_FAILED')
  }

  return created
}

export function parseLoginBody(body: unknown) {
  return loginBodySchema.parse(body)
}
