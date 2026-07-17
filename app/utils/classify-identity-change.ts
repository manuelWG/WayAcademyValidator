/**
 * Classify identity-related field changes for import audit (critical risk).
 * Delegates critical-field set to shared import domain (phase 3A).
 */
import {
  hasCriticalImportChange,
  isCriticalImportField
} from '~~/shared/import/critical-fields'

export type IdentityRiskLevel = 'critical' | 'high' | 'medium'

export function isCriticalIdentityField(field: string): boolean {
  return isCriticalImportField(field)
}

export function classifyChangedFields(changedFields: string[]): {
  riskLevel: IdentityRiskLevel
  hasCriticalIdentityChange: boolean
} {
  const hasCriticalIdentityChange = hasCriticalImportChange(changedFields)
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
