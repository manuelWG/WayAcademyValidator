import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'
import { normalizeDocument } from '~~/shared/import/normalize-document'
import {
  DocumentSecurityError,
  type DocumentKeyMaterial,
  getDocumentKeyMaterial,
  MAX_DOCUMENT_KEY_VERSION,
  MIN_DOCUMENT_KEY_VERSION
} from './document-keys'

/**
 * AES-256-GCM document protection with a fixed, unambiguous AAD bound to the
 * purpose, the owning record UUID and the key version. HMAC-SHA-256 lookup uses
 * an independent key. Uses only node:crypto. No plaintext, ciphertext, key
 * material or OpenSSL detail ever appears in error messages.
 */

export type DocumentPurpose = 'certificate-document' | 'import-row-document'

export type DocumentContext = {
  purpose: DocumentPurpose
  recordId: string
}

export type EncryptedDocument = {
  ciphertext: Buffer
  nonce: Buffer
  authTag: Buffer
  keyVersion: number
}

const ALGORITHM = 'aes-256-gcm'
export const DOCUMENT_NONCE_LENGTH_BYTES = 12
export const DOCUMENT_AUTH_TAG_LENGTH_BYTES = 16
export const DOCUMENT_AAD_LENGTH_BYTES = 46

const AAD_MAGIC = Buffer.from('WAYACADEMY-DOCUMENT\0', 'ascii')
const AAD_FORMAT_VERSION = 0x01

const PURPOSE_BYTE: Record<DocumentPurpose, number> = {
  'certificate-document': 0x01,
  'import-row-document': 0x02
}

const UUID_PATTERN
  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function contextInvalid(message: string): never {
  throw new DocumentSecurityError('DOCUMENT_CONTEXT_INVALID', message)
}

function uuidToBytes(recordId: string): Buffer {
  if (typeof recordId !== 'string' || !UUID_PATTERN.test(recordId)) {
    contextInvalid('Invalid record identifier for document context')
  }
  return Buffer.from(recordId.replace(/-/g, ''), 'hex')
}

function purposeToByte(purpose: DocumentPurpose): number {
  const byte = PURPOSE_BYTE[purpose]
  if (byte === undefined) contextInvalid('Unknown document purpose')
  return byte
}

/**
 * Deterministic 46-byte AAD. Rejects key versions outside the accepted
 * PostgreSQL `integer` range before emitting the buffer.
 */
export function buildDocumentAad(context: DocumentContext, keyVersion: number): Buffer {
  if (
    !Number.isSafeInteger(keyVersion)
    || keyVersion < MIN_DOCUMENT_KEY_VERSION
    || keyVersion > MAX_DOCUMENT_KEY_VERSION
  ) {
    contextInvalid('Document key version out of range')
  }

  const purposeByte = purposeToByte(context.purpose)
  const uuidBytes = uuidToBytes(context.recordId)

  const versionBytes = Buffer.alloc(8)
  versionBytes.writeBigUInt64BE(BigInt(keyVersion))

  const aad = Buffer.concat([
    AAD_MAGIC,
    Buffer.from([AAD_FORMAT_VERSION]),
    Buffer.from([purposeByte]),
    versionBytes,
    uuidBytes
  ])

  if (aad.length !== DOCUMENT_AAD_LENGTH_BYTES) {
    contextInvalid('Unexpected AAD length')
  }
  return aad
}

export function encryptDocument(
  plaintext: string,
  context: DocumentContext,
  material?: DocumentKeyMaterial
): EncryptedDocument {
  const keyMaterial = material ?? getDocumentKeyMaterial()
  const aad = buildDocumentAad(context, keyMaterial.keyVersion)
  const nonce = randomBytes(DOCUMENT_NONCE_LENGTH_BYTES)

  const cipher = createCipheriv(ALGORITHM, keyMaterial.encryptionKey, nonce, {
    authTagLength: DOCUMENT_AUTH_TAG_LENGTH_BYTES
  })
  cipher.setAAD(aad)
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  return { ciphertext, nonce, authTag, keyVersion: keyMaterial.keyVersion }
}

export function decryptDocument(
  encrypted: EncryptedDocument,
  context: DocumentContext,
  material?: DocumentKeyMaterial
): string {
  const keyMaterial = material ?? getDocumentKeyMaterial()

  if (encrypted.keyVersion !== keyMaterial.keyVersion) {
    throw new DocumentSecurityError(
      'DOCUMENT_KEY_VERSION_UNAVAILABLE',
      'The requested document key version is not available'
    )
  }
  if (
    encrypted.nonce.length !== DOCUMENT_NONCE_LENGTH_BYTES
    || encrypted.authTag.length !== DOCUMENT_AUTH_TAG_LENGTH_BYTES
  ) {
    throw new DocumentSecurityError('DOCUMENT_DECRYPTION_FAILED', 'Document could not be decrypted')
  }

  const aad = buildDocumentAad(context, encrypted.keyVersion)

  try {
    const decipher = createDecipheriv(ALGORITHM, keyMaterial.encryptionKey, encrypted.nonce, {
      authTagLength: DOCUMENT_AUTH_TAG_LENGTH_BYTES
    })
    decipher.setAAD(aad)
    decipher.setAuthTag(encrypted.authTag)
    const plaintext = Buffer.concat([
      decipher.update(encrypted.ciphertext),
      decipher.final()
    ])
    return plaintext.toString('utf8')
  } catch {
    throw new DocumentSecurityError('DOCUMENT_DECRYPTION_FAILED', 'Document could not be decrypted')
  }
}

/**
 * HMAC-SHA-256 of the normalized document, lowercase hex (64 chars).
 * Rejects documents that normalize to empty; staging callers must check first
 * and store null instead of calling this.
 */
export function computeDocumentLookupHmac(document: string, material?: DocumentKeyMaterial): string {
  const keyMaterial = material ?? getDocumentKeyMaterial()
  const normalized = normalizeDocument(document)
  if (normalized === '') {
    contextInvalid('Document normalizes to empty; lookup HMAC is undefined')
  }
  return createHmac('sha256', keyMaterial.hmacKey)
    .update(Buffer.from(normalized, 'utf8'))
    .digest('hex')
}
