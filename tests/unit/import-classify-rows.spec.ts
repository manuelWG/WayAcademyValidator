import { describe, expect, it } from 'vitest'
import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'
import { classifyImportRows } from '~~/shared/import/classify-import-rows'
import {
  parseImportCsvRow,
  sortChangedFields,
  sortIssueCodes,
  type RawImportCsvRow
} from '~~/shared/schemas/import'

function raw(overrides: Partial<RawImportCsvRow> = {}): RawImportCsvRow {
  return {
    certificate_issue_id: '9001',
    certificate_code: 'WAY-ABC-01',
    certificate_id: '501',
    course_id: '101',
    course_name: 'Liderazgo',
    user_id: '1201',
    participant_name: 'Ana Rojas',
    document_number: '52.334.891',
    issued_at_unix: '1736942400',
    ...overrides
  }
}

function comparableFromParsed(): ComparableCertificate {
  const parsed = parseImportCsvRow(raw())
  if (!parsed.ok) throw new Error('fixture parse failed')
  const d = parsed.data
  return {
    certificateCode: d.certificateCode,
    certificateCodeNormalized: d.certificateCodeNormalized,
    snapshot: {
      participantName: d.participantName,
      documentNumber: d.documentNumber,
      documentNumberNormalized: d.documentNumberNormalized,
      courseName: d.courseName,
      issuedAt: d.issuedAt,
      moodle: {
        certificateIssueId: d.certificateIssueId,
        certificateId: d.certificateId,
        courseId: d.courseId,
        userId: d.userId
      }
    }
  }
}

describe('parseImportCsvRow', () => {
  it('trims certificate code without changing case and keeps originals', () => {
    const parsed = parseImportCsvRow(raw({
      certificate_code: '  Way-ABC-01  ',
      document_number: '52.334.891'
    }))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.certificateCode).toBe('  Way-ABC-01  ')
    expect(parsed.data.certificateCodeNormalized).toBe('Way-ABC-01')
    expect(parsed.data.documentNumber).toBe('52.334.891')
    expect(parsed.data.documentNumberNormalized).toBe('52334891')
  })

  it('preserves original numeric strings with leading zeros while canonical value drops them', () => {
    const parsed = parseImportCsvRow(raw({
      certificate_issue_id: '00123',
      user_id: '00007',
      issued_at_unix: '0001736942400'
    }))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // canonical values normalize leading zeros
    expect(parsed.data.certificateIssueId).toBe(123)
    expect(parsed.data.userId).toBe(7)
    // originals must remain byte-for-byte on the classified row (via pipeline raw)
    const [row] = classifyImportRows(
      [{ rowNumber: 2, raw: raw({ certificate_issue_id: '00123', user_id: '00007' }), match: { kind: 'none' } }],
      101
    )
    expect(row?.raw.certificate_issue_id).toBe('00123')
    expect(row?.raw.user_id).toBe('00007')
    expect(row?.incoming?.certificateIssueId).toBe(123)
  })

  it('distinguishes empty (MISSING_FIELD) from non-empty invalid (INVALID_NUMBER)', () => {
    const empty = parseImportCsvRow(raw({ certificate_issue_id: '' }))
    expect(empty.ok).toBe(false)
    if (!empty.ok) expect(empty.issueCodes).toContain('MISSING_FIELD')

    const spaces = parseImportCsvRow(raw({ certificate_issue_id: '   ' }))
    expect(spaces.ok).toBe(false)
    if (!spaces.ok) expect(spaces.issueCodes).toContain('MISSING_FIELD')

    for (const bad of ['12.0', '-1', '1e2', '+3', 'abc', String(Number.MAX_SAFE_INTEGER + 1)]) {
      const result = parseImportCsvRow(raw({ certificate_id: bad }))
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.issueCodes).toContain('INVALID_NUMBER')
    }
  })

  it('treats empty issued_at_unix as MISSING_FIELD and invalid formats as INVALID_ISSUED_AT', () => {
    const empty = parseImportCsvRow(raw({ issued_at_unix: '' }))
    expect(empty.ok).toBe(false)
    if (!empty.ok) expect(empty.issueCodes).toEqual(['MISSING_FIELD'])

    for (const bad of ['12.5', '-1', '1e5', '+9', 'nope']) {
      const result = parseImportCsvRow(raw({ issued_at_unix: bad }))
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.issueCodes).toEqual(['INVALID_ISSUED_AT'])
    }
  })

  it('rejects documents that normalize to empty as MISSING_FIELD', () => {
    for (const doc of ['', '   ', '...', '---', ' . - . ', '.-. ']) {
      const result = parseImportCsvRow(raw({ document_number: doc }))
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.issueCodes).toContain('MISSING_FIELD')
    }
  })

  it('keeps issueCodes canonically ordered and de-duplicated', () => {
    const result = parseImportCsvRow(raw({
      certificate_code: '',
      certificate_issue_id: '',
      certificate_id: 'x',
      issued_at_unix: 'nope'
    }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issueCodes).toEqual([
        'MISSING_FIELD',
        'INVALID_NUMBER',
        'INVALID_ISSUED_AT'
      ])
    }
  })
})

describe('sortIssueCodes / sortChangedFields', () => {
  it('orders issueCodes and changedFields canonically', () => {
    expect(sortIssueCodes([
      'IDENTITY_COLLISION',
      'MISSING_FIELD',
      'DUPLICATE_CERTIFICATE_ISSUE_ID',
      'DUPLICATE_CERTIFICATE_CODE'
    ])).toEqual([
      'MISSING_FIELD',
      'DUPLICATE_CERTIFICATE_CODE',
      'DUPLICATE_CERTIFICATE_ISSUE_ID',
      'IDENTITY_COLLISION'
    ])

    expect(sortChangedFields([
      'issuedAt',
      'participantName',
      'certificateCode',
      'courseId'
    ])).toEqual([
      'certificateCode',
      'courseId',
      'participantName',
      'issuedAt'
    ])
  })
})

describe('classifyImportRows', () => {
  it('marks structural invalids as error and skips them for duplicates', () => {
    const results = classifyImportRows(
      [
        { rowNumber: 2, raw: raw({ certificate_code: '' }), match: { kind: 'none' } },
        { rowNumber: 3, raw: raw({ certificate_code: 'DUP', certificate_issue_id: '1' }), match: { kind: 'none' } },
        { rowNumber: 4, raw: raw({ certificate_code: 'DUP', certificate_issue_id: '2' }), match: { kind: 'none' } }
      ],
      101
    )
    expect(results.find(r => r.rowNumber === 2)?.status).toBe('error')
    expect(results.find(r => r.rowNumber === 2)?.issueCodes).toContain('MISSING_FIELD')
    expect(results.find(r => r.rowNumber === 3)?.issueCodes).toEqual(['DUPLICATE_CERTIFICATE_CODE'])
    expect(results.find(r => r.rowNumber === 4)?.issueCodes).toEqual(['DUPLICATE_CERTIFICATE_CODE'])
  })

  it('accumulates both duplicate issue codes on the same rows', () => {
    const results = classifyImportRows(
      [
        {
          rowNumber: 2,
          raw: raw({ certificate_code: 'SAME', certificate_issue_id: '77' }),
          match: { kind: 'none' }
        },
        {
          rowNumber: 3,
          raw: raw({ certificate_code: 'SAME', certificate_issue_id: '77' }),
          match: { kind: 'none' }
        }
      ],
      101
    )
    for (const row of results) {
      expect(row.status).toBe('error')
      expect(row.issueCodes).toEqual([
        'DUPLICATE_CERTIFICATE_CODE',
        'DUPLICATE_CERTIFICATE_ISSUE_ID'
      ])
    }
  })

  it('classifies identity_collision as critical_conflict', () => {
    const cert = comparableFromParsed()
    const other = {
      ...cert,
      certificateCode: 'OTHER',
      certificateCodeNormalized: 'OTHER'
    }
    const results = classifyImportRows(
      [
        {
          rowNumber: 2,
          raw: raw(),
          match: { kind: 'identity_collision', byCode: cert, byIssueId: other }
        }
      ],
      101
    )
    expect(results[0]?.status).toBe('critical_conflict')
    expect(results[0]?.issueCodes).toEqual(['IDENTITY_COLLISION'])
  })

  it('preserves the raw CSV row even when structural validation fails', () => {
    const rawRow = raw({ certificate_code: '', certificate_issue_id: '00123' })
    const results = classifyImportRows(
      [{ rowNumber: 2, raw: rawRow, match: { kind: 'none' } }],
      101
    )
    expect(results[0]?.status).toBe('error')
    expect(results[0]?.incoming).toBeNull()
    expect(results[0]?.raw).toEqual(rawRow)
    expect(results[0]?.raw.certificate_issue_id).toBe('00123')
  })

  it('is idempotent for the same input', () => {
    const items = [
      { rowNumber: 2, raw: raw(), match: { kind: 'none' as const } }
    ]
    expect(classifyImportRows(items, 101)).toEqual(classifyImportRows(items, 101))
  })
})
