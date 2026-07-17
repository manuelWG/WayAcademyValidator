export const CRITICAL_IMPORT_FIELDS = [
  'certificateCode',
  'certificateIssueId',
  'courseId',
  'userId',
  'participantName',
  'documentNumberNormalized'
] as const

export const NON_CRITICAL_IMPORT_FIELDS = [
  'certificateId',
  'issuedAt',
  'courseName'
] as const

export type CriticalImportField = (typeof CRITICAL_IMPORT_FIELDS)[number]
export type NonCriticalImportField = (typeof NON_CRITICAL_IMPORT_FIELDS)[number]

const CRITICAL_SET = new Set<string>(CRITICAL_IMPORT_FIELDS)

export function isCriticalImportField(field: string): boolean {
  return CRITICAL_SET.has(field)
}

export function hasCriticalImportChange(changedFields: string[]): boolean {
  return changedFields.some(isCriticalImportField)
}
