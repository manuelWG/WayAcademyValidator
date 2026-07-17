import { describe, expect, it } from 'vitest'
import { normalizeCertificateCode } from '../../app/utils/normalize-certificate-code'
import { normalizeDocument } from '../../app/utils/normalize-document'

describe('normalizeCertificateCode', () => {
  it('trims without changing case', () => {
    expect(normalizeCertificateCode('  Way-ABC-01  ')).toBe('Way-ABC-01')
  })

  it('preserves mixed case', () => {
    expect(normalizeCertificateCode('WAY-ldr-2025-0042')).toBe('WAY-ldr-2025-0042')
  })
})

describe('normalizeDocument', () => {
  it('removes spaces, dots and dashes and uppercases letters', () => {
    expect(normalizeDocument('52.334.891')).toBe('52334891')
    expect(normalizeDocument('ab-12.3')).toBe('AB123')
  })
})
