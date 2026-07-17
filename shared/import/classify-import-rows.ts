import { classifyImportRow } from '~~/shared/import/classify-import-row'
import { detectInternalDuplicates } from '~~/shared/import/detect-internal-duplicates'
import type { ExistingCertificateMatch } from '~~/shared/import/existing-certificate-match'
import type { ClassifiedImportRow, RawImportCsvRow } from '~~/shared/schemas/import'
import { parseImportCsvRow } from '~~/shared/schemas/import'

export type ClassifyImportRowsItem = {
  rowNumber: number
  raw: RawImportCsvRow
  /** Match resolved by caller (ignored when row is structural error or duplicate). */
  match: ExistingCertificateMatch
}

/**
 * Full 3A pipeline: parse → structural errors → internal duplicates → course → match/diff.
 */
export function classifyImportRows(
  items: ClassifyImportRowsItem[],
  selectedMoodleCourseId: number
): ClassifiedImportRow[] {
  const structuralErrors: ClassifiedImportRow[] = []
  const valid: {
    rowNumber: number
    raw: RawImportCsvRow
    incoming: NonNullable<ClassifiedImportRow['incoming']>
    match: ExistingCertificateMatch
  }[] = []

  for (const item of items) {
    const parsed = parseImportCsvRow(item.raw)
    if (!parsed.ok) {
      structuralErrors.push({
        rowNumber: item.rowNumber,
        status: 'error',
        issueCodes: parsed.issueCodes,
        reason: parsed.reason,
        changedFields: [],
        raw: item.raw,
        incoming: null,
        match: null
      })
      continue
    }
    valid.push({
      rowNumber: item.rowNumber,
      raw: item.raw,
      incoming: parsed.data,
      match: item.match
    })
  }

  const duplicates = detectInternalDuplicates(
    valid.map(v => ({ rowNumber: v.rowNumber, incoming: v.incoming }))
  )

  const classifiedValid = valid.map(v =>
    classifyImportRow({
      rowNumber: v.rowNumber,
      raw: v.raw,
      incoming: v.incoming,
      match: v.match,
      selectedMoodleCourseId,
      duplicateIssueCodes: duplicates.get(v.rowNumber) ?? []
    })
  )

  return [...structuralErrors, ...classifiedValid].sort((a, b) => a.rowNumber - b.rowNumber)
}
