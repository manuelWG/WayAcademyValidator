import type { CertificateSnapshot } from './certificate'
import type { ImportIncomingData } from './import'

export type AuditRiskLevel = 'critical' | 'high' | 'medium'
export type AuditStatus = 'pending' | 'accepted' | 'rejected'

export interface AuditConflict {
  id: string
  certificateCode: string
  courseLocalId: string
  courseName: string
  importId: string
  originalFileName: string
  fileHash: string
  csvRowNumber: number
  importedBy: string
  detectedAt: string
  storedSnapshot: CertificateSnapshot
  incomingData: ImportIncomingData
  changedFields: string[]
  riskLevel: AuditRiskLevel
  status: AuditStatus
  reviewedAt: string | null
  reviewedBy: string | null
  observation: string | null
}
