import { z } from 'zod'
import { normalizeCertificateCode } from '~~/shared/import/normalize-certificate-code'
import { normalizeDocument } from '~~/shared/import/normalize-document'
import type { ExistingCertificateMatch } from '~~/shared/import/existing-certificate-match'

export const IMPORT_ISSUE_CODES = [
  'MISSING_FIELD',
  'INVALID_NUMBER',
  'INVALID_ISSUED_AT',
  'DUPLICATE_CERTIFICATE_CODE',
  'DUPLICATE_CERTIFICATE_ISSUE_ID',
  'COURSE_MISMATCH',
  'IDENTITY_COLLISION'
] as const

export type ImportIssueCode = (typeof IMPORT_ISSUE_CODES)[number]

export const IMPORT_ISSUE_CODE_ORDER: readonly ImportIssueCode[] = IMPORT_ISSUE_CODES

export type ImportRowStatus
  = | 'new'
    | 'unchanged'
    | 'conflict'
    | 'critical_conflict'
    | 'error'

export const CHANGED_FIELDS_ORDER = [
  'certificateCode',
  'certificateIssueId',
  'certificateId',
  'courseId',
  'userId',
  'participantName',
  'documentNumberNormalized',
  'courseName',
  'issuedAt'
] as const

export type ChangedFieldName = (typeof CHANGED_FIELDS_ORDER)[number]

export interface ImportIncomingData {
  participantName: string
  documentNumber: string
  documentNumberNormalized: string
  courseName: string
  courseId: number
  certificateCode: string
  certificateCodeNormalized: string
  issuedAt: string
  certificateIssueId: number
  certificateId: number
  userId: number
}

/** Raw CSV cell strings (no permissive coercion). */
export const rawImportCsvRowSchema = z
  .object({
    certificate_issue_id: z.string(),
    certificate_code: z.string(),
    certificate_id: z.string(),
    course_id: z.string(),
    course_name: z.string(),
    user_id: z.string(),
    participant_name: z.string(),
    document_number: z.string(),
    issued_at_unix: z.string()
  })
  .strict()

export type RawImportCsvRow = z.infer<typeof rawImportCsvRowSchema>

export type ClassifiedImportRow = {
  rowNumber: number
  status: ImportRowStatus
  issueCodes: ImportIssueCode[]
  reason: string
  changedFields: string[]
  /** Exact original CSV strings for all nine columns, preserved even when validation fails. */
  raw: RawImportCsvRow
  incoming: ImportIncomingData | null
  match: ExistingCertificateMatch | null
}

export function sortIssueCodes(codes: Iterable<ImportIssueCode>): ImportIssueCode[] {
  const set = new Set(codes)
  return IMPORT_ISSUE_CODE_ORDER.filter(code => set.has(code))
}

export function sortChangedFields(fields: Iterable<string>): string[] {
  const set = new Set(fields)
  return CHANGED_FIELDS_ORDER.filter(field => set.has(field))
}

const STRICT_DECIMAL = /^\d+$/

type IntParseResult
  = | { ok: true, value: number }
    | { ok: false, empty: boolean }

function parsePositiveSafeInt(raw: string): IntParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, empty: true }
  if (!STRICT_DECIMAL.test(trimmed)) return { ok: false, empty: false }
  const value = Number(trimmed)
  if (!Number.isSafeInteger(value) || value <= 0) return { ok: false, empty: false }
  return { ok: true, value }
}

function parseNonNegativeSafeInt(raw: string): IntParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, empty: true }
  if (!STRICT_DECIMAL.test(trimmed)) return { ok: false, empty: false }
  const value = Number(trimmed)
  if (!Number.isSafeInteger(value) || value < 0) return { ok: false, empty: false }
  return { ok: true, value }
}

function unixToIso(unixSeconds: number): string | null {
  const ms = unixSeconds * 1000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export type ParseImportCsvRowResult
  = | { ok: true, data: ImportIncomingData }
    | { ok: false, issueCodes: ImportIssueCode[], reason: string }

/**
 * Validates raw CSV strings into canonical ImportIncomingData.
 * Preserves originals; applies only approved normalizations.
 */
export function parseImportCsvRow(rawInput: unknown): ParseImportCsvRowResult {
  const shape = rawImportCsvRowSchema.safeParse(rawInput)
  if (!shape.success) {
    return {
      ok: false,
      issueCodes: sortIssueCodes(['MISSING_FIELD']),
      reason: 'Fila con forma inválida o columnas ausentes'
    }
  }

  const raw = shape.data
  const issueCodes: ImportIssueCode[] = []

  const certificateCodeRaw = raw.certificate_code
  const participantNameRaw = raw.participant_name
  const documentNumberRaw = raw.document_number
  const courseNameRaw = raw.course_name

  if (certificateCodeRaw.trim() === '') issueCodes.push('MISSING_FIELD')
  if (participantNameRaw.trim() === '') issueCodes.push('MISSING_FIELD')
  if (courseNameRaw.trim() === '') issueCodes.push('MISSING_FIELD')

  // Document is required after normalization: '', spaces, dots and dashes collapse to ''.
  const documentNumberNormalized = normalizeDocument(documentNumberRaw)
  if (documentNumberNormalized === '') issueCodes.push('MISSING_FIELD')

  const issueId = parsePositiveSafeInt(raw.certificate_issue_id)
  const certificateId = parsePositiveSafeInt(raw.certificate_id)
  const courseId = parsePositiveSafeInt(raw.course_id)
  const userId = parsePositiveSafeInt(raw.user_id)

  for (const result of [issueId, certificateId, courseId, userId]) {
    if (!result.ok) {
      issueCodes.push(result.empty ? 'MISSING_FIELD' : 'INVALID_NUMBER')
    }
  }

  let issuedAt: string | null = null
  if (raw.issued_at_unix.trim() === '') {
    issueCodes.push('MISSING_FIELD')
  } else {
    const unix = parseNonNegativeSafeInt(raw.issued_at_unix)
    if (!unix.ok) {
      issueCodes.push('INVALID_ISSUED_AT')
    } else {
      issuedAt = unixToIso(unix.value)
      if (issuedAt === null) issueCodes.push('INVALID_ISSUED_AT')
    }
  }

  const sorted = sortIssueCodes(issueCodes)
  if (
    sorted.length > 0
    || !issueId.ok
    || !certificateId.ok
    || !courseId.ok
    || !userId.ok
    || issuedAt === null
  ) {
    return {
      ok: false,
      issueCodes: sorted,
      reason: 'Fila con validación estructural fallida'
    }
  }

  return {
    ok: true,
    data: {
      participantName: participantNameRaw,
      documentNumber: documentNumberRaw,
      documentNumberNormalized,
      courseName: courseNameRaw,
      courseId: courseId.value,
      certificateCode: certificateCodeRaw,
      certificateCodeNormalized: normalizeCertificateCode(certificateCodeRaw),
      issuedAt,
      certificateIssueId: issueId.value,
      certificateId: certificateId.value,
      userId: userId.value
    }
  }
}
