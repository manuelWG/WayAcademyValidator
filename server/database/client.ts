import process from 'node:process'
import { Pool } from '@neondatabase/serverless'
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import { createError } from 'h3'
import * as schema from './schema'

export type AppDatabase = NeonDatabase<typeof schema>

let db: AppDatabase | null = null

/**
 * Resolve DATABASE_URL without opening a connection.
 * Prefer process.env.DATABASE_URL (scripts + local .env), then Nuxt runtimeConfig.
 */
export function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim()
  }
  try {
    const config = useRuntimeConfig()
    const fromConfig = (config.databaseUrl as string | undefined)?.trim()
    if (fromConfig) return fromConfig
  } catch {
    // Outside Nuxt context (scripts / unit tests)
  }
  return undefined
}

/**
 * Lazy Neon WebSocket + Drizzle client with interactive transaction support.
 * Importing this module must not open a connection or require DATABASE_URL.
 */
export function useDb(): AppDatabase {
  if (db) return db

  const url = resolveDatabaseUrl()
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database is not configured',
      message: 'DATABASE_URL is required for this operation'
    })
  }

  const pool = new Pool({ connectionString: url })
  db = drizzle(pool, { schema })
  return db
}

/** Test helper: reset lazy singleton between unit tests. */
export function resetDbClientForTests() {
  db = null
}
