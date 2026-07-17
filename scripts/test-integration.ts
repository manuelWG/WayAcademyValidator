/**
 * Manual integration checks against Neon.
 * Requires DATABASE_URL_TEST explicitly — never falls back to DATABASE_URL.
 *
 * Cleanup: only deletes rows created in this run (prefixed ids).
 * Does not drop/truncate tables or reset schema.
 */
import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, like } from 'drizzle-orm'
import { adminUsers, courses } from '../server/database/schema'
import { hashAdminPassword } from '../server/utils/password'

const PREFIX = `it_${Date.now()}_`

async function confirmIfNeeded() {
  if (process.env.CI === 'true') return
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(
      'This will write temporary rows to DATABASE_URL_TEST (confirm with YES): '
    )
    if (answer.trim() !== 'YES') {
      throw new Error('Aborted by user')
    }
  } finally {
    rl.close()
  }
}

async function main() {
  const url = process.env.DATABASE_URL_TEST?.trim()
  if (!url) {
    console.error('Error: DATABASE_URL_TEST is required. No fallback to DATABASE_URL.')
    process.exitCode = 1
    return
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL_TEST) {
    // unreachable due to check above; kept as documentation guard
  }

  console.log('Integration target: Neon via DATABASE_URL_TEST (credentials not printed).')
  await confirmIfNeeded()

  const sql = neon(url)
  const db = drizzle(sql, { schema: { adminUsers, courses } })

  const username = `${PREFIX}admin`.slice(0, 64)
  const moodleCourseId = Number(`${Date.now()}`.slice(-9))

  const passwordHash = await hashAdminPassword('Integration1Pass')
  const [admin] = await db
    .insert(adminUsers)
    .values({
      username,
      displayName: 'Integration Admin',
      passwordHash
    })
    .returning({ id: adminUsers.id })

  const [course] = await db
    .insert(courses)
    .values({
      moodleCourseId,
      name: `${PREFIX}course`,
      notes: '',
      isPublished: false
    })
    .returning({ id: courses.id })

  if (!admin || !course) {
    throw new Error('Insert failed')
  }

  // Cleanup only this run's rows
  await db.delete(courses).where(eq(courses.id, course.id))
  await db.delete(adminUsers).where(eq(adminUsers.id, admin.id))

  // Ensure no leftover by prefix (admin username)
  await db.delete(adminUsers).where(like(adminUsers.username, `${PREFIX}%`))

  console.log('Integration smoke test passed (rows created and cleaned).')
}

main().catch((error) => {
  console.error('Integration test failed.')
  if (process.env.DEBUG) console.error(error)
  process.exitCode = 1
})
