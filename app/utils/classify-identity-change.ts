/**
 * Classify identity-related field changes for import audit (critical risk).
 * Used by unit tests now; CSV import will call this in a later phase.
 */
const CRITICAL_FIELDS = new Set([
  'participantName',
  'documentNumber',
  'documentNumberNormalized',
  'userId',
  'certificateIssueId',
  'certificateId',
  'courseId'
])

export type IdentityRiskLevel = 'critical' | 'high' | 'medium'

export function isCriticalIdentityField(field: string): boolean {
  return CRITICAL_FIELDS.has(field)
}

export function classifyChangedFields(changedFields: string[]): {
  riskLevel: IdentityRiskLevel
  hasCriticalIdentityChange: boolean
} {
  const hasCriticalIdentityChange = changedFields.some(isCriticalIdentityField)
  return {
    hasCriticalIdentityChange,
    riskLevel: hasCriticalIdentityChange ? 'critical' : 'medium'
  }
}

export function classifyNameChange(stored: string, incoming: string): boolean {
  return stored.trim() !== incoming.trim()
}

export function classifyDocumentChange(
  storedNormalized: string,
  incomingNormalized: string
): boolean {
  return storedNormalized !== incomingNormalized
}

export function classifyMoodleIdChange(
  field: 'userId' | 'certificateIssueId' | 'certificateId' | 'courseId',
  stored: number,
  incoming: number
): boolean {
  return stored !== incoming && isCriticalIdentityField(field)
}
