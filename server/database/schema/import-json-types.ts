import type { ImportIncomingData, RawImportCsvRow } from '~~/shared/schemas/import'

/**
 * JSONB payload contracts. None of these types may carry the original document
 * number or its normalized form. Field names do NOT certify the data as
 * non-sensitive: participant names and other values can be personal data and
 * must never appear in logs. Runtime sanitization belongs to Phase 3C; the
 * key allow-lists and pure guards below exist for schema/tests.
 */

/** Exact CSV cell strings delivered by the parser, minus the document. */
export type RawImportRowWithoutDocument = Omit<RawImportCsvRow, 'document_number'>

/** Canonical Phase 3A incoming data, minus original and normalized document. */
export type IncomingImportDataWithoutDocument = Omit<
  ImportIncomingData,
  'documentNumber' | 'documentNumberNormalized'
>

/** Previously stored certificate snapshot, minus any document form. */
export interface StoredCertificateSnapshotWithoutDocument {
  certificateCode: string
  certificateCodeNormalized: string
  participantName: string
  courseName: string
  issuedAt: string
  certificateIssueId: number
  certificateId: number
  courseId: number
  userId: number
}

export const RAW_IMPORT_ROW_WITHOUT_DOCUMENT_KEYS = [
  'certificate_issue_id',
  'certificate_code',
  'certificate_id',
  'course_id',
  'course_name',
  'user_id',
  'participant_name',
  'issued_at_unix'
] as const

export const INCOMING_IMPORT_DATA_WITHOUT_DOCUMENT_KEYS = [
  'participantName',
  'courseName',
  'courseId',
  'certificateCode',
  'certificateCodeNormalized',
  'issuedAt',
  'certificateIssueId',
  'certificateId',
  'userId'
] as const

export const STORED_CERTIFICATE_SNAPSHOT_WITHOUT_DOCUMENT_KEYS = [
  'certificateCode',
  'certificateCodeNormalized',
  'participantName',
  'courseName',
  'issuedAt',
  'certificateIssueId',
  'certificateId',
  'courseId',
  'userId'
] as const

/** Any key that would leak the original or normalized document into JSONB. */
export const FORBIDDEN_DOCUMENT_KEYS = [
  'document_number',
  'documentNumber',
  'documentNumberNormalized'
] as const

/** Pure guard: true when the object exposes no forbidden document key. */
export function hasNoDocumentKeys(value: Record<string, unknown>): boolean {
  return !FORBIDDEN_DOCUMENT_KEYS.some(key => Object.prototype.hasOwnProperty.call(value, key))
}

/** Pure guard: true when the object keys are exactly the allowed allow-list. */
export function hasExactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value)
  if (keys.length !== allowed.length) return false
  const allowedSet = new Set(allowed)
  return keys.every(key => allowedSet.has(key))
}
