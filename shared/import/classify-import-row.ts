import { compareCertificateToIncoming } from '~~/shared/import/compare-snapshot'
import { hasCriticalImportChange } from '~~/shared/import/critical-fields'
import type { ExistingCertificateMatch } from '~~/shared/import/existing-certificate-match'
import type {
  ClassifiedImportRow,
  ImportIncomingData,
  ImportIssueCode,
  RawImportCsvRow
} from '~~/shared/schemas/import'
import { sortIssueCodes } from '~~/shared/schemas/import'

export type ClassifyImportRowInput = {
  rowNumber: number
  /** Original CSV strings, preserved verbatim on the result. */
  raw: RawImportCsvRow
  incoming: ImportIncomingData
  match: ExistingCertificateMatch
  selectedMoodleCourseId: number
  /** Precomputed duplicate issue codes for this row (may be empty). */
  duplicateIssueCodes?: ImportIssueCode[]
}

/**
 * Classifies a structurally valid row (after parse). Applies course check, duplicates, then match.
 */
export function classifyImportRow(input: ClassifyImportRowInput): ClassifiedImportRow {
  const { rowNumber, raw, incoming, match, selectedMoodleCourseId } = input
  const duplicateIssueCodes = input.duplicateIssueCodes ?? []

  if (duplicateIssueCodes.length > 0) {
    return {
      rowNumber,
      status: 'error',
      issueCodes: sortIssueCodes(duplicateIssueCodes),
      reason: 'Clave duplicada dentro del archivo',
      changedFields: [],
      raw,
      incoming,
      match: null
    }
  }

  if (incoming.courseId !== selectedMoodleCourseId) {
    return {
      rowNumber,
      status: 'error',
      issueCodes: sortIssueCodes(['COURSE_MISMATCH']),
      reason: `course_id=${incoming.courseId} no coincide con el curso seleccionado (${selectedMoodleCourseId})`,
      changedFields: [],
      raw,
      incoming,
      match: null
    }
  }

  if (match.kind === 'identity_collision') {
    return {
      rowNumber,
      status: 'critical_conflict',
      issueCodes: sortIssueCodes(['IDENTITY_COLLISION']),
      reason: 'El código y el certificate_issue_id corresponden a certificados distintos',
      changedFields: [],
      raw,
      incoming,
      match
    }
  }

  if (match.kind === 'none') {
    return {
      rowNumber,
      status: 'new',
      issueCodes: [],
      reason: 'Certificado nuevo',
      changedFields: [],
      raw,
      incoming,
      match
    }
  }

  const changedFields = compareCertificateToIncoming(match.certificate, incoming)

  if (changedFields.length === 0) {
    return {
      rowNumber,
      status: 'unchanged',
      issueCodes: [],
      reason: 'Sin diferencias respecto al certificado almacenado',
      changedFields: [],
      raw,
      incoming,
      match
    }
  }

  if (hasCriticalImportChange(changedFields)) {
    return {
      rowNumber,
      status: 'critical_conflict',
      issueCodes: [],
      reason: 'Cambio crítico respecto al certificado almacenado',
      changedFields,
      raw,
      incoming,
      match
    }
  }

  return {
    rowNumber,
    status: 'conflict',
    issueCodes: [],
    reason: 'Cambio no crítico respecto al certificado almacenado',
    changedFields,
    raw,
    incoming,
    match
  }
}
