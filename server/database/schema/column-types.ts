import { customType } from 'drizzle-orm/pg-core'

/**
 * PostgreSQL `bytea` column mapped to a Node Buffer.
 * Drizzle pg-core has no native bytea builder, so we declare it here once and
 * reuse it for encrypted document payloads (ciphertext, nonce, auth tag).
 */
export const bytea = customType<{ data: Buffer, driverData: Buffer }>({
  dataType() {
    return 'bytea'
  }
})
