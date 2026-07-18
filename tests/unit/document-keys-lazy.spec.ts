import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DocumentSecurityError,
  getDocumentKeyMaterial,
  MAX_DOCUMENT_KEY_VERSION,
  parseDocumentKeyVersion
} from '../../server/security/document-keys'

const ENC_KEY = Buffer.alloc(32, 1).toString('base64')
const HMAC_KEY = Buffer.alloc(32, 2).toString('base64')

const KEYS = ['DOCUMENT_ENCRYPTION_KEY', 'DOCUMENT_ENCRYPTION_KEY_VERSION', 'DOCUMENT_LOOKUP_HMAC_KEY'] as const

function clearEnv() {
  for (const key of KEYS) Reflect.deleteProperty(process.env, key)
}

function setValidEnv() {
  process.env.DOCUMENT_ENCRYPTION_KEY = ENC_KEY
  process.env.DOCUMENT_LOOKUP_HMAC_KEY = HMAC_KEY
  process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1'
}

describe('document keys lazy + fail-closed', () => {
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {}
    for (const key of KEYS) saved[key] = process.env[key]
    clearEnv()
  })

  afterEach(() => {
    for (const key of KEYS) {
      const value = saved[key]
      if (value === undefined) Reflect.deleteProperty(process.env, key)
      else process.env[key] = value
    }
  })

  it('does not read env at import time; getDocumentKeyMaterial fails closed without env', () => {
    expect(() => getDocumentKeyMaterial()).toThrow(DocumentSecurityError)
  })

  it('loads valid synthetic material', () => {
    setValidEnv()
    const material = getDocumentKeyMaterial()
    expect(material.encryptionKey).toHaveLength(32)
    expect(material.hmacKey).toHaveLength(32)
    expect(material.keyVersion).toBe(1)
  })

  it('rejects equal encryption and HMAC keys', () => {
    process.env.DOCUMENT_ENCRYPTION_KEY = ENC_KEY
    process.env.DOCUMENT_LOOKUP_HMAC_KEY = ENC_KEY
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1'
    expect(() => getDocumentKeyMaterial()).toThrow(DocumentSecurityError)
  })

  it('rejects missing, empty and whitespace keys', () => {
    for (const bad of [undefined, '', '   ']) {
      clearEnv()
      if (bad !== undefined) process.env.DOCUMENT_ENCRYPTION_KEY = bad
      process.env.DOCUMENT_LOOKUP_HMAC_KEY = HMAC_KEY
      process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1'
      expect(() => getDocumentKeyMaterial()).toThrow(DocumentSecurityError)
    }
  })

  it('rejects non-canonical base64 and wrong-length keys', () => {
    const cases = [
      `${ENC_KEY} `, // trailing space -> non-canonical
      'not_base64_@@@',
      Buffer.alloc(16, 3).toString('base64'), // 16 bytes, too short
      Buffer.alloc(48, 3).toString('base64') // 48 bytes, too long
    ]
    for (const bad of cases) {
      process.env.DOCUMENT_ENCRYPTION_KEY = bad
      process.env.DOCUMENT_LOOKUP_HMAC_KEY = HMAC_KEY
      process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1'
      expect(() => getDocumentKeyMaterial()).toThrow(DocumentSecurityError)
    }
  })

  it('never leaks key material in error messages', () => {
    process.env.DOCUMENT_ENCRYPTION_KEY = ENC_KEY
    process.env.DOCUMENT_LOOKUP_HMAC_KEY = ENC_KEY
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1'
    try {
      getDocumentKeyMaterial()
      expect.unreachable('should have thrown')
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain(ENC_KEY)
      expect(message).not.toContain(HMAC_KEY)
    }
  })

  describe('parseDocumentKeyVersion', () => {
    it('accepts 1 and the PostgreSQL integer maximum', () => {
      expect(parseDocumentKeyVersion('1')).toBe(1)
      expect(parseDocumentKeyVersion(String(MAX_DOCUMENT_KEY_VERSION))).toBe(2147483647)
    })

    it('rejects out-of-range, non-integer and non-numeric values', () => {
      const invalid = ['0', '-1', '2147483648', '1.5', '01', 'abc', '', ' ', '1e3', '9007199254740992']
      for (const value of invalid) {
        expect(() => parseDocumentKeyVersion(value)).toThrow(DocumentSecurityError)
      }
    })
  })
})
