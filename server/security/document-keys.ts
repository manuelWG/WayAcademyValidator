import { timingSafeEqual } from 'node:crypto'
import process from 'node:process'

/**
 * Lazy, fail-closed loading and validation of document protection secrets.
 *
 * Importing this module never reads or validates secrets. Validation happens
 * only when key material is requested. Errors are generic and never include
 * keys, documents, ciphertext, nonces, tags or raw environment values.
 */

export const DOCUMENT_KEY_LENGTH_BYTES = 32
export const MIN_DOCUMENT_KEY_VERSION = 1
export const MAX_DOCUMENT_KEY_VERSION = 2147483647

export type DocumentKeyMaterial = {
  encryptionKey: Buffer
  hmacKey: Buffer
  keyVersion: number
}

export type DocumentSecurityErrorCode
  = | 'DOCUMENT_KEY_CONFIGURATION_INVALID'
    | 'DOCUMENT_DECRYPTION_FAILED'
    | 'DOCUMENT_KEY_VERSION_UNAVAILABLE'
    | 'DOCUMENT_CONTEXT_INVALID'

export class DocumentSecurityError extends Error {
  readonly code: DocumentSecurityErrorCode

  constructor(code: DocumentSecurityErrorCode, message: string) {
    super(message)
    this.name = 'DocumentSecurityError'
    this.code = code
  }
}

const VERSION_PATTERN = /^[1-9]\d*$/

function invalidConfig(): never {
  // Generic message; never echoes the offending value.
  throw new DocumentSecurityError(
    'DOCUMENT_KEY_CONFIGURATION_INVALID',
    'Document key configuration is missing or invalid'
  )
}

/** Decode a strictly canonical base64 32-byte key or fail closed. */
function decodeCanonicalKey(raw: string | undefined): Buffer {
  if (typeof raw !== 'string') invalidConfig()
  // Reject absence, empty and whitespace-only values.
  if (raw.trim() === '') invalidConfig()

  let decoded: Buffer
  try {
    decoded = Buffer.from(raw, 'base64')
  } catch {
    invalidConfig()
  }

  // Canonical base64: re-encoding must reproduce the exact input (no surrounding
  // whitespace, no non-canonical padding, only valid base64 characters).
  if (decoded.toString('base64') !== raw) invalidConfig()
  if (decoded.length !== DOCUMENT_KEY_LENGTH_BYTES) invalidConfig()
  return decoded
}

/** Parse an integer version strictly within the PostgreSQL `integer` range. */
export function parseDocumentKeyVersion(raw: string | undefined): number {
  if (typeof raw !== 'string') invalidConfig()
  const value = raw.trim()
  if (!VERSION_PATTERN.test(value)) invalidConfig()
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) invalidConfig()
  if (parsed < MIN_DOCUMENT_KEY_VERSION || parsed > MAX_DOCUMENT_KEY_VERSION) invalidConfig()
  return parsed
}

/** Constant-time equality of two same-length buffers. */
function buffersEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Read and validate document key material from process.env. Only invoked when
 * cryptographic work is requested, proving schema/crypto imports are lazy.
 */
export function getDocumentKeyMaterial(): DocumentKeyMaterial {
  const encryptionKey = decodeCanonicalKey(process.env.DOCUMENT_ENCRYPTION_KEY)
  const hmacKey = decodeCanonicalKey(process.env.DOCUMENT_LOOKUP_HMAC_KEY)
  const keyVersion = parseDocumentKeyVersion(process.env.DOCUMENT_ENCRYPTION_KEY_VERSION)

  // The two keys must be independent; reject accidental reuse.
  if (buffersEqual(encryptionKey, hmacKey)) invalidConfig()

  return { encryptionKey, hmacKey, keyVersion }
}
