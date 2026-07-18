import { describe, expect, it } from 'vitest'
import {
  buildDocumentAad,
  computeDocumentLookupHmac,
  decryptDocument,
  DOCUMENT_AAD_LENGTH_BYTES,
  DOCUMENT_AUTH_TAG_LENGTH_BYTES,
  DOCUMENT_NONCE_LENGTH_BYTES,
  encryptDocument,
  type DocumentContext
} from '../../server/security/document-crypto'
import { DocumentSecurityError, type DocumentKeyMaterial } from '../../server/security/document-keys'

const material: DocumentKeyMaterial = {
  encryptionKey: Buffer.alloc(32, 7),
  hmacKey: Buffer.alloc(32, 9),
  keyVersion: 1
}

const ROW_ID = '11111111-1111-4111-8111-111111111111'
const CERT_ID = '22222222-2222-4222-8222-222222222222'
const rowContext: DocumentContext = { purpose: 'import-row-document', recordId: ROW_ID }
const certContext: DocumentContext = { purpose: 'certificate-document', recordId: CERT_ID }

describe('buildDocumentAad', () => {
  it('produces a deterministic 46-byte buffer', () => {
    const a = buildDocumentAad(rowContext, 1)
    const b = buildDocumentAad(rowContext, 1)
    expect(a).toHaveLength(DOCUMENT_AAD_LENGTH_BYTES)
    expect(a.equals(b)).toBe(true)
  })

  it('changes with purpose, record id and key version', () => {
    const base = buildDocumentAad(rowContext, 1)
    expect(base.equals(buildDocumentAad(certContext, 1))).toBe(false)
    expect(base.equals(buildDocumentAad({ purpose: 'import-row-document', recordId: CERT_ID }, 1))).toBe(false)
    expect(base.equals(buildDocumentAad(rowContext, 2))).toBe(false)
  })

  it('rejects key versions outside 1..2147483647', () => {
    for (const v of [0, -1, 2147483648, 1.5]) {
      expect(() => buildDocumentAad(rowContext, v)).toThrow(DocumentSecurityError)
    }
  })

  it('rejects malformed record ids', () => {
    expect(() => buildDocumentAad({ purpose: 'import-row-document', recordId: 'not-a-uuid' }, 1))
      .toThrow(DocumentSecurityError)
  })
})

describe('encrypt/decrypt document', () => {
  it('round trips UTF-8 with the correct context', () => {
    const plaintext = 'V-1.234.567 Ñandú'
    const enc = encryptDocument(plaintext, rowContext, material)
    expect(enc.nonce).toHaveLength(DOCUMENT_NONCE_LENGTH_BYTES)
    expect(enc.authTag).toHaveLength(DOCUMENT_AUTH_TAG_LENGTH_BYTES)
    expect(enc.keyVersion).toBe(1)
    expect(decryptDocument(enc, rowContext, material)).toBe(plaintext)
  })

  it('allows empty plaintext for staging', () => {
    const enc = encryptDocument('', rowContext, material)
    expect(decryptDocument(enc, rowContext, material)).toBe('')
  })

  it('uses a fresh nonce and ciphertext per operation', () => {
    const a = encryptDocument('same', rowContext, material)
    const b = encryptDocument('same', rowContext, material)
    expect(a.nonce.equals(b.nonce)).toBe(false)
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false)
  })

  it('fails when ciphertext, nonce or tag are altered', () => {
    const enc = encryptDocument('secret', rowContext, material)

    const badCipher = { ...enc, ciphertext: Buffer.from(enc.ciphertext) }
    badCipher.ciphertext[0] ^= 0xff
    expect(() => decryptDocument(badCipher, rowContext, material)).toThrow(DocumentSecurityError)

    const badNonce = { ...enc, nonce: Buffer.from(enc.nonce) }
    badNonce.nonce[0] ^= 0xff
    expect(() => decryptDocument(badNonce, rowContext, material)).toThrow(DocumentSecurityError)

    const badTag = { ...enc, authTag: Buffer.from(enc.authTag) }
    badTag.authTag[0] ^= 0xff
    expect(() => decryptDocument(badTag, rowContext, material)).toThrow(DocumentSecurityError)
  })

  it('fails on key version mismatch with a specific code', () => {
    const enc = encryptDocument('secret', rowContext, material)
    const wrongVersion = { ...enc, keyVersion: 2 }
    try {
      decryptDocument(wrongVersion, rowContext, material)
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DocumentSecurityError)
      expect((error as DocumentSecurityError).code).toBe('DOCUMENT_KEY_VERSION_UNAVAILABLE')
    }
  })

  it('fails when purpose, record id or record differ', () => {
    const enc = encryptDocument('secret', rowContext, material)
    expect(() => decryptDocument(enc, certContext, material)).toThrow(DocumentSecurityError)
    expect(() => decryptDocument(enc, { purpose: 'import-row-document', recordId: CERT_ID }, material))
      .toThrow(DocumentSecurityError)
  })

  it('never leaks plaintext or key material in error messages', () => {
    const enc = encryptDocument('super-secret-document', rowContext, material)
    const badTag = { ...enc, authTag: Buffer.from(enc.authTag) }
    badTag.authTag[0] ^= 0xff
    try {
      decryptDocument(badTag, rowContext, material)
      expect.unreachable('should have thrown')
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain('super-secret-document')
      expect(message).not.toContain(material.encryptionKey.toString('base64'))
    }
  })

  it('models the 3D staging -> certificate re-encryption without reusing payload', () => {
    const plaintext = 'V-9.999.999'
    const staged = encryptDocument(plaintext, rowContext, material)

    // 3D: decrypt staging, then re-encrypt under the certificate context.
    const recovered = decryptDocument(staged, rowContext, material)
    const certEncrypted = encryptDocument(recovered, certContext, material)

    expect(certEncrypted.ciphertext.equals(staged.ciphertext)).toBe(false)
    expect(decryptDocument(certEncrypted, certContext, material)).toBe(plaintext)
    // Staging ciphertext cannot be read as a certificate.
    expect(() => decryptDocument(staged, certContext, material)).toThrow(DocumentSecurityError)
  })
})

describe('computeDocumentLookupHmac', () => {
  it('is deterministic and returns 64 lowercase hex chars', () => {
    const hmac = computeDocumentLookupHmac('V-1.234.567', material)
    expect(hmac).toMatch(/^[0-9a-f]{64}$/)
    expect(computeDocumentLookupHmac('V-1.234.567', material)).toBe(hmac)
  })

  it('is equal for inputs that normalize equally', () => {
    expect(computeDocumentLookupHmac('v 1.234.567', material))
      .toBe(computeDocumentLookupHmac('V-1234567', material))
  })

  it('changes with a different HMAC key', () => {
    const other: DocumentKeyMaterial = { ...material, hmacKey: Buffer.alloc(32, 3) }
    expect(computeDocumentLookupHmac('V-1.234.567', other))
      .not.toBe(computeDocumentLookupHmac('V-1.234.567', material))
  })

  it('rejects documents that normalize to empty', () => {
    expect(() => computeDocumentLookupHmac('  .-. ', material)).toThrow(DocumentSecurityError)
  })
})
