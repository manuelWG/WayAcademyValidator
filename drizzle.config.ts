import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL?.trim()) {
  // Allow `db:generate` introspection of schema files without a live URL in some setups;
  // migrate still requires DATABASE_URL at apply time.
  console.warn('[drizzle.config] DATABASE_URL is not set. Migrations cannot be applied without it.')
}

export default defineConfig({
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || ''
  },
  strict: true,
  verbose: true
})
