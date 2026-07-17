import type { ImportIncomingData, ImportIssueCode } from '~~/shared/schemas/import'
import { sortIssueCodes } from '~~/shared/schemas/import'

export type ValidRowForDuplicateCheck = {
  rowNumber: number
  incoming: ImportIncomingData
}

/**
 * Marks all occurrences of duplicated normalized codes / issue IDs among valid rows.
 * Invalid or empty keys are never used for duplicate detection (callers must pass parsed rows only).
 */
export function detectInternalDuplicates(
  rows: ValidRowForDuplicateCheck[]
): Map<number, ImportIssueCode[]> {
  const codeCounts = new Map<string, number>()
  const issueIdCounts = new Map<number, number>()

  for (const row of rows) {
    const code = row.incoming.certificateCodeNormalized
    const issueId = row.incoming.certificateIssueId
    // Parsed rows always have non-empty normalized code and positive issue id
    codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1)
    issueIdCounts.set(issueId, (issueIdCounts.get(issueId) ?? 0) + 1)
  }

  const result = new Map<number, ImportIssueCode[]>()

  for (const row of rows) {
    const codes: ImportIssueCode[] = []
    const code = row.incoming.certificateCodeNormalized
    const issueId = row.incoming.certificateIssueId
    if ((codeCounts.get(code) ?? 0) > 1) codes.push('DUPLICATE_CERTIFICATE_CODE')
    if ((issueIdCounts.get(issueId) ?? 0) > 1) codes.push('DUPLICATE_CERTIFICATE_ISSUE_ID')
    if (codes.length > 0) {
      result.set(row.rowNumber, sortIssueCodes(codes))
    }
  }

  return result
}
