/**
 * Apply Drizzle SQL migrations to Neon via HTTP driver.
 * Requires DATABASE_URL (Neon branch "dev").
 *
 * Does not print the connection string.
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('Error: DATABASE_URL is required to migrate (Neon branch "dev").')
    process.exitCode = 1
    return
  }

  console.log('Applying migrations to Neon (DATABASE_URL configured; branch should be "dev").')
  const sql = neon(url)
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder: './server/database/migrations' })
  console.log('Migrations applied successfully.')
}

main().catch(() => {
  console.error('Error: migration failed.')
  process.exitCode = 1
})
