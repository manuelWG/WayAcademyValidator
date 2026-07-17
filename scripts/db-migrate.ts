/**
 * Apply Drizzle SQL migrations to Neon via HTTP driver.
 *
 * Safe usage (Neon branch "dev" only):
 *
 *   Interactive:
 *     MIGRATION_TARGET=dev DATABASE_URL=... npm run db:migrate
 *     # then type YES when prompted
 *
 *   Non-interactive:
 *     MIGRATION_TARGET=dev MIGRATE_CONFIRM=YES DATABASE_URL=... npm run db:migrate
 *
 * Does not print the connection string or credentials.
 * Does not infer the Neon branch from hostname.
 */
import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

async function confirmInteractive(): Promise<void> {
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(
      'Confirm migration to Neon branch "dev" (type YES exactly): '
    )
    if (answer.trim() !== 'YES') {
      throw new Error('Migration aborted: confirmation must be YES')
    }
  } finally {
    rl.close()
  }
}

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('Error: DATABASE_URL is required.')
    process.exitCode = 1
    return
  }

  const target = process.env.MIGRATION_TARGET?.trim()
  if (target !== 'dev') {
    console.error(
      'Error: MIGRATION_TARGET must be exactly "dev". Refusing to migrate.'
    )
    process.exitCode = 1
    return
  }

  const nonInteractiveConfirm = process.env.MIGRATE_CONFIRM?.trim()
  if (input.isTTY && output.isTTY && !nonInteractiveConfirm) {
    await confirmInteractive()
  } else if (nonInteractiveConfirm !== 'YES') {
    console.error(
      'Error: non-interactive migrate requires MIGRATE_CONFIRM=YES (and MIGRATION_TARGET=dev).'
    )
    process.exitCode = 1
    return
  }

  console.log('Applying migrations to Neon (target=dev; credentials not printed).')
  const sql = neon(url)
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder: './server/database/migrations' })
  console.log('Migrations applied successfully.')
}

main().catch(() => {
  console.error('Error: migration failed.')
  process.exitCode = 1
})
