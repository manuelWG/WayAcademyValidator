/**
 * Manual integration checks against Neon.
 * Requires DATABASE_URL_TEST explicitly — never falls back to DATABASE_URL.
 *
 * Cleanup: only deletes rows created in this run (tracked IDs), via try/finally.
 * Does not drop/truncate tables or reset schema.
 */
import 'dotenv/config'
import { randomInt } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { adminUsers, courses } from '../server/database/schema'
import { hashAdminPassword } from '../server/utils/password'

const PREFIX = `it_${Date.now()}_${randomInt(1_000_000)}_`

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

  console.log('Integration target: Neon via DATABASE_URL_TEST (credentials not printed).')
  await confirmIfNeeded()

  const sql = neon(url)
  const db = drizzle(sql, { schema: { adminUsers, courses } })

  const createdAdminIds: string[] = []
  const createdCourseIds: string[] = []

  try {
    const username = `${PREFIX}admin`.slice(0, 64)
    // Prefer a wide random bigint-safe positive id to avoid collisions with real Moodle IDs.
    const moodleCourseId = randomInt(1_000_000_000, 2_000_000_000)

    const passwordHash = await hashAdminPassword('Integration1Pass')
    const [admin] = await db
      .insert(adminUsers)
      .values({
        username,
        displayName: 'Integration Admin',
        passwordHash
      })
      .returning({ id: adminUsers.id })

    if (!admin) {
      throw new Error('Admin insert failed')
    }
    createdAdminIds.push(admin.id)

    const [course] = await db
      .insert(courses)
      .values({
        moodleCourseId,
        name: `${PREFIX}course`,
        notes: '',
        isPublished: false
      })
      .returning({ id: courses.id })

    if (!course) {
      throw new Error('Course insert failed')
    }
    createdCourseIds.push(course.id)

    console.log('Integration smoke test passed (rows created).')
  } finally {
    for (const id of createdCourseIds) {
      await db.delete(courses).where(eq(courses.id, id)).catch(() => undefined)
    }
    for (const id of createdAdminIds) {
      await db.delete(adminUsers).where(eq(adminUsers.id, id)).catch(() => undefined)
    }
    console.log('Integration cleanup finished for this run\'s IDs.')
  }
}

main().catch((error) => {
  console.error('Integration test failed.')
  if (process.env.DEBUG) console.error(error)
  process.exitCode = 1
})
