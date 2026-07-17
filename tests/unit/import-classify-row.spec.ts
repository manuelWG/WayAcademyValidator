import { describe, expect, it } from 'vitest'
import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'
import { classifyImportRow } from '~~/shared/import/classify-import-row'
import type { ImportIncomingData, RawImportCsvRow } from '~~/shared/schemas/import'

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

function incoming(overrides: Partial<ImportIncomingData> = {}): ImportIncomingData {
  return {
    participantName: 'Ana Rojas',
    documentNumber: '52.334.891',
    documentNumberNormalized: '52334891',
    courseName: 'Liderazgo',
    courseId: 101,
    certificateCode: 'WAY-ABC-01',
    certificateCodeNormalized: 'WAY-ABC-01',
    issuedAt: '2026-01-15T12:00:00.000Z',
    certificateIssueId: 9001,
    certificateId: 501,
    userId: 1201,
    ...overrides
  }
}

function comparable(from: ImportIncomingData = incoming()): ComparableCertificate {
  return {
    certificateCode: from.certificateCode,
    certificateCodeNormalized: from.certificateCodeNormalized,
    snapshot: {
      participantName: from.participantName,
      documentNumber: from.documentNumber,
      documentNumberNormalized: from.documentNumberNormalized,
      courseName: from.courseName,
      issuedAt: from.issuedAt,
      moodle: {
        certificateIssueId: from.certificateIssueId,
        certificateId: from.certificateId,
        courseId: from.courseId,
        userId: from.userId
      }
    }
  }
}

describe('classifyImportRow', () => {
  it('returns new when match is none', () => {
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming(),
      match: { kind: 'none' },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('new')
    expect(result.issueCodes).toEqual([])
  })

  it('preserves the raw CSV row on the classified result', () => {
    const rawRow = raw()
    const result = classifyImportRow({
      rowNumber: 2,
      raw: rawRow,
      incoming: incoming(),
      match: { kind: 'none' },
      selectedMoodleCourseId: 101
    })
    expect(result.raw).toEqual(rawRow)
  })

  it('returns unchanged when same_certificate has no diffs', () => {
    const data = incoming()
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: data,
      match: { kind: 'same_certificate', certificate: comparable(data) },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('unchanged')
  })

  it('returns conflict for non-critical diffs', () => {
    const data = incoming()
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming({ certificateId: 999, issuedAt: '2026-02-01T00:00:00.000Z', courseName: 'Otro' }),
      match: { kind: 'same_certificate', certificate: comparable(data) },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('conflict')
    expect(result.changedFields).toEqual(['certificateId', 'courseName', 'issuedAt'])
    expect(result.issueCodes).toEqual([])
  })

  it('returns critical_conflict for critical diffs', () => {
    const data = incoming()
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming({ participantName: 'Otra', userId: 9 }),
      match: { kind: 'same_certificate', certificate: comparable(data) },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('critical_conflict')
    expect(result.changedFields).toEqual(['userId', 'participantName'])
  })

  it('prefers critical_conflict when mixed with non-critical diffs', () => {
    const data = incoming()
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming({ participantName: 'Otra', certificateId: 8 }),
      match: { kind: 'same_certificate', certificate: comparable(data) },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('critical_conflict')
    expect(result.changedFields).toEqual(['certificateId', 'participantName'])
  })

  it('returns error COURSE_MISMATCH when course differs', () => {
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw({ course_id: '999' }),
      incoming: incoming({ courseId: 999 }),
      match: { kind: 'none' },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('error')
    expect(result.issueCodes).toEqual(['COURSE_MISMATCH'])
  })

  it('returns critical_conflict with IDENTITY_COLLISION', () => {
    const byCode = comparable(incoming({ certificateCodeNormalized: 'A', certificateIssueId: 1 }))
    const byIssueId = comparable(incoming({
      certificateCode: 'B',
      certificateCodeNormalized: 'B',
      certificateIssueId: 2
    }))
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming(),
      match: { kind: 'identity_collision', byCode, byIssueId },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('critical_conflict')
    expect(result.issueCodes).toEqual(['IDENTITY_COLLISION'])
    expect(result.changedFields).toEqual([])
    expect(result.match?.kind).toBe('identity_collision')
  })

  it('returns critical_conflict when stored courseId differs from incoming course', () => {
    const stored = comparable(incoming({ courseId: 202 }))
    const result = classifyImportRow({
      rowNumber: 2,
      raw: raw(),
      incoming: incoming({ courseId: 101 }),
      match: { kind: 'same_certificate', certificate: stored },
      selectedMoodleCourseId: 101
    })
    expect(result.status).toBe('critical_conflict')
    expect(result.changedFields).toEqual(['courseId'])
    expect(result.issueCodes).toEqual([])
  })
})
