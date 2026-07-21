import { describe, expect, it } from 'vitest'
import {
  parseImportCsv,
  rawWithoutDocument,
  terminalImportBatchStatus,
  withoutDocument
} from '../../server/services/imports.service'
import { incomingToDto, snapshotToDto } from '../../server/services/audit.service'
import { auditDecisionBodySchema, IMPORT_BATCH_STATUSES } from '../../shared/schemas/import-api'
import type { ImportIncomingData, RawImportCsvRow } from '../../shared/schemas/import'

const HEADER = [
  'certificate_issue_id',
  'certificate_code',
  'certificate_id',
  'course_id',
  'course_name',
  'user_id',
  'participant_name',
  'document_number',
  'issued_at_unix'
].join(',')

function csv(...rows: string[]): Buffer {
  return Buffer.from([HEADER, ...rows].join('\r\n'), 'utf8')
}

const incoming: ImportIncomingData = {
  participantName: 'Ana Pérez',
  documentNumber: '12.345-67',
  documentNumberNormalized: '1234567',
  courseName: 'Curso, avanzado',
  courseId: 101,
  certificateCode: 'CERT-001',
  certificateCodeNormalized: 'CERT-001',
  issuedAt: '2024-01-01T00:00:00.000Z',
  certificateIssueId: 201,
  certificateId: 301,
  userId: 401
}

describe('server Moodle CSV parser', () => {
  it('parses BOM, CRLF, quoted commas and escaped quotes without changing values', () => {
    const parsed = parseImportCsv(Buffer.concat([
      Buffer.from('\uFEFF'),
      csv('201,CERT-001,301,101,"Curso, avanzado",401,"Ana ""Anita"" Pérez",12.345-67,1704067200')
    ]))

    expect(parsed).toEqual([{
      rowNumber: 2,
      raw: {
        certificate_issue_id: '201',
        certificate_code: 'CERT-001',
        certificate_id: '301',
        course_id: '101',
        course_name: 'Curso, avanzado',
        user_id: '401',
        participant_name: 'Ana "Anita" Pérez',
        document_number: '12.345-67',
        issued_at_unix: '1704067200'
      }
    }])
  })

  it.each([
    ['empty file', Buffer.alloc(0)],
    ['header only', Buffer.from(HEADER)],
    ['wrong header order', Buffer.from(HEADER.replace('certificate_issue_id,certificate_code', 'certificate_code,certificate_issue_id'))],
    ['wrong cell count', csv('201,CERT-001')],
    ['unclosed quote', csv('201,"CERT-001,301,101,Course,401,Ana,123,1704067200')],
    ['invalid UTF-8', Buffer.from([0xff, 0xfe])]
  ])('rejects %s', (_label, value) => {
    expect(() => parseImportCsv(value)).toThrow()
  })
})

describe('safe import and audit DTO contracts', () => {
  it('removes clear and normalized documents from staged JSON and raw CSV JSON', () => {
    expect(withoutDocument(incoming)).toEqual({
      participantName: incoming.participantName,
      courseName: incoming.courseName,
      courseId: incoming.courseId,
      certificateCode: incoming.certificateCode,
      certificateCodeNormalized: incoming.certificateCodeNormalized,
      issuedAt: incoming.issuedAt,
      certificateIssueId: incoming.certificateIssueId,
      certificateId: incoming.certificateId,
      userId: incoming.userId
    })

    const raw: RawImportCsvRow = {
      certificate_issue_id: '201',
      certificate_code: 'CERT-001',
      certificate_id: '301',
      course_id: '101',
      course_name: 'Course',
      user_id: '401',
      participant_name: 'Ana',
      document_number: '12.345-67',
      issued_at_unix: '1704067200'
    }
    expect(rawWithoutDocument(raw)).not.toHaveProperty('document_number')
  })

  it('allow-lists audit incoming and snapshot DTO fields', () => {
    const unsafeIncoming = {
      ...withoutDocument(incoming)!,
      documentNumber: 'secret',
      documentNumberNormalized: 'secret'
    }
    const unsafeSnapshot = {
      certificateCode: 'CERT-001',
      certificateCodeNormalized: 'CERT-001',
      participantName: 'Ana',
      courseName: 'Course',
      issuedAt: incoming.issuedAt,
      certificateIssueId: 201,
      certificateId: 301,
      courseId: 101,
      userId: 401,
      documentNumber: 'secret'
    }

    expect(incomingToDto(unsafeIncoming)).not.toHaveProperty('documentNumber')
    expect(incomingToDto(unsafeIncoming)).not.toHaveProperty('documentNumberNormalized')
    expect(snapshotToDto(unsafeSnapshot)).not.toHaveProperty('documentNumber')
  })
})

describe('import batch states and audit decisions', () => {
  it('keeps the complete state contract and selects the correct terminal state', () => {
    expect(IMPORT_BATCH_STATUSES).toEqual([
      'pending', 'processing', 'paused', 'completed', 'completed_with_conflicts', 'failed'
    ])
    expect(terminalImportBatchStatus({ conflictCount: 0, criticalConflictCount: 0, errorCount: 0 }))
      .toBe('completed')
    expect(terminalImportBatchStatus({ conflictCount: 1, criticalConflictCount: 0, errorCount: 0 }))
      .toBe('completed_with_conflicts')
    expect(terminalImportBatchStatus({ conflictCount: 0, criticalConflictCount: 1, errorCount: 0 }))
      .toBe('completed_with_conflicts')
    expect(terminalImportBatchStatus({ conflictCount: 0, criticalConflictCount: 0, errorCount: 1 }))
      .toBe('completed_with_conflicts')
  })

  it('accepts only safe, explicit audit decisions with a meaningful observation', () => {
    expect(auditDecisionBodySchema.parse({ decision: 'accepted', observation: '  verified  ' }))
      .toEqual({ decision: 'accepted', observation: 'verified' })
    expect(auditDecisionBodySchema.parse({ decision: 'rejected', observation: 'No coincide' }).decision)
      .toBe('rejected')
    expect(() => auditDecisionBodySchema.parse({ decision: 'pending', observation: 'x' })).toThrow()
    expect(() => auditDecisionBodySchema.parse({ decision: 'accepted', observation: '' })).toThrow()
    expect(() => auditDecisionBodySchema.parse({
      decision: 'accepted', observation: 'x', documentNumber: 'secret'
    })).toThrow()
  })
})
