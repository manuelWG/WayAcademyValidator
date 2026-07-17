/**
 * Interactive / automated script to create an admin user in Neon (dev branch).
 *
 * Interactive:
 *   npm run create-admin
 *
 * Non-interactive (automation only; do not put ADMIN_PASSWORD in .env.example as persistent config):
 *   ADMIN_USERNAME=... ADMIN_DISPLAY_NAME=... ADMIN_PASSWORD=... npm run create-admin
 */
import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import {
  displayNameSchema,
  normalizedUsernameSchema
} from '../shared/schemas/auth'
import { adminUsers } from '../server/database/schema'
import {
  hashAdminPassword,
  passwordPolicyMessage,
  validatePasswordPolicy
} from '../server/utils/password'

function maskTarget(): string {
  return 'Neon (DATABASE_URL from environment — branch should be "dev")'
}

async function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return (await rl.question(question)).trimEnd()
}

async function promptHidden(question: string): Promise<string> {
  // Best-effort hidden input (works when stdin is a TTY).
  if (!input.isTTY || !output.isTTY) {
    const rl = createInterface({ input, output })
    try {
      return await prompt(rl, question)
    } finally {
      rl.close()
    }
  }

  output.write(question)
  return await new Promise((resolve, reject) => {
    const chunks: string[] = []
    const onData = (char: Buffer) => {
      const c = char.toString('utf8')
      if (c === '\n' || c === '\r' || c === '\u0004') {
        input.setRawMode(false)
        input.pause()
        input.removeListener('data', onData)
        output.write('\n')
        resolve(chunks.join(''))
        return
      }
      if (c === '\u0003') {
        input.setRawMode(false)
        input.pause()
        input.removeListener('data', onData)
        reject(new Error('Cancelled'))
        return
      }
      if (c === '\u007f' || c === '\b') {
        chunks.pop()
        return
      }
      chunks.push(c)
    }
    input.setRawMode(true)
    input.resume()
    input.on('data', onData)
  })
}

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('Error: DATABASE_URL is required.')
    process.exitCode = 1
    return
  }

  console.log(`Connecting to configured database: ${maskTarget()}`)
  // Do not print the connection string.

  const fromEnv = Boolean(
    process.env.ADMIN_USERNAME
    && process.env.ADMIN_DISPLAY_NAME
    && process.env.ADMIN_PASSWORD
  )

  let rawUsername: string
  let rawDisplayName: string
  let password: string
  let confirm: string

  if (fromEnv) {
    rawUsername = process.env.ADMIN_USERNAME!
    rawDisplayName = process.env.ADMIN_DISPLAY_NAME!
    password = process.env.ADMIN_PASSWORD!
    confirm = password
  } else {
    const rl = createInterface({ input, output })
    try {
      rawUsername = await prompt(rl, 'Username: ')
      rawDisplayName = await prompt(rl, 'Display name: ')
    } finally {
      rl.close()
    }
    password = await promptHidden('Password (hidden): ')
    confirm = await promptHidden('Confirm password (hidden): ')
  }

  if (password !== confirm) {
    console.error('Error: passwords do not match.')
    process.exitCode = 1
    return
  }

  let username: string
  let displayName: string
  try {
    username = normalizedUsernameSchema.parse(rawUsername)
    displayName = displayNameSchema.parse(rawDisplayName)
  } catch {
    console.error('Error: invalid username or display name.')
    process.exitCode = 1
    return
  }

  const policyError = validatePasswordPolicy(password)
  if (policyError) {
    console.error(`Error: ${passwordPolicyMessage(policyError)}`)
    process.exitCode = 1
    return
  }

  const sql = neon(url)
  const database = drizzle(sql, { schema: { adminUsers } })

  const [existing] = await database
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1)

  if (existing) {
    console.error('Error: username already exists.')
    process.exitCode = 1
    return
  }

  const passwordHash = await hashAdminPassword(password)
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
    console.error('Error: failed to create admin.')
    process.exitCode = 1
    return
  }

  console.log(`Admin created: ${created.username} (${created.displayName})`)
}

main().catch((error) => {
  console.error('Error: could not create admin.')
  if (process.env.DEBUG) {
    console.error(error)
  }
  process.exitCode = 1
})
