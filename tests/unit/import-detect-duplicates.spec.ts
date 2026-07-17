import { describe, expect, it } from 'vitest'
import { detectInternalDuplicates } from '~~/shared/import/detect-internal-duplicates'
import type { ImportIncomingData } from '~~/shared/schemas/import'

function incoming(overrides: Partial<ImportIncomingData>): ImportIncomingData {
  return {
    participantName: 'A',
    documentNumber: '1',
    documentNumberNormalized: '1',
    courseName: 'C',
    courseId: 101,
    certificateCode: 'CODE',
    certificateCodeNormalized: 'CODE',
    issuedAt: '2026-01-01T00:00:00.000Z',
    certificateIssueId: 1,
    certificateId: 1,
    userId: 1,
    ...overrides
  }
}

describe('detectInternalDuplicates', () => {
  it('marks all occurrences of a duplicated code', () => {
    const rows = [
      { rowNumber: 2, incoming: incoming({ certificateCodeNormalized: 'A', certificateIssueId: 1 }) },
      { rowNumber: 3, incoming: incoming({ certificateCodeNormalized: 'A', certificateIssueId: 2 }) },
      { rowNumber: 4, incoming: incoming({ certificateCodeNormalized: 'A', certificateIssueId: 3 }) }
    ]
    const dups = detectInternalDuplicates(rows)
    expect(dups.get(2)).toEqual(['DUPLICATE_CERTIFICATE_CODE'])
    expect(dups.get(3)).toEqual(['DUPLICATE_CERTIFICATE_CODE'])
    expect(dups.get(4)).toEqual(['DUPLICATE_CERTIFICATE_CODE'])
  })

  it('marks all occurrences of a duplicated issue id', () => {
    const rows = [
      { rowNumber: 2, incoming: incoming({ certificateCodeNormalized: 'A', certificateIssueId: 9 }) },
      { rowNumber: 3, incoming: incoming({ certificateCodeNormalized: 'B', certificateIssueId: 9 }) }
    ]
    const dups = detectInternalDuplicates(rows)
    expect(dups.get(2)).toEqual(['DUPLICATE_CERTIFICATE_ISSUE_ID'])
    expect(dups.get(3)).toEqual(['DUPLICATE_CERTIFICATE_ISSUE_ID'])
  })

  it('accumulates both duplicate codes in canonical order', () => {
    const rows = [
      { rowNumber: 2, incoming: incoming({ certificateCodeNormalized: 'X', certificateIssueId: 7 }) },
      { rowNumber: 3, incoming: incoming({ certificateCodeNormalized: 'X', certificateIssueId: 7 }) }
    ]
    const dups = detectInternalDuplicates(rows)
    expect(dups.get(2)).toEqual([
      'DUPLICATE_CERTIFICATE_CODE',
      'DUPLICATE_CERTIFICATE_ISSUE_ID'
    ])
    expect(dups.get(3)).toEqual([
      'DUPLICATE_CERTIFICATE_CODE',
      'DUPLICATE_CERTIFICATE_ISSUE_ID'
    ])
  })
})
