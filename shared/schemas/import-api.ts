import { z } from 'zod'
import type { ChangedFieldName, ImportIssueCode, ImportRowStatus } from './import'

export const importBatchIdParamSchema = z.string().uuid()
export const importCourseIdFieldSchema = z.string().uuid()

export const IMPORT_BATCH_STATUSES = [
  'pending',
  'processing',
  'paused',
  'completed',
  'completed_with_conflicts',
  'failed'
] as const

export type ImportBatchStatusDto = (typeof IMPORT_BATCH_STATUSES)[number]

export interface ImportCountersDto {
  total: number
  new: number
  unchanged: number
  conflict: number
  criticalConflict: number
  errors: number
}

/** Canonical incoming values safe for API/JSONB use. Document values are deliberately absent. */
export interface ImportIncomingDataDto {
  participantName: string
  courseName: string
  courseId: number
  certificateCode: string
  certificateCodeNormalized: string
  issuedAt: string
  certificateIssueId: number
  certificateId: number
  userId: number
}

/** Stored certificate snapshot safe for API use. No original or normalized document is exposed. */
export interface StoredCertificateSnapshotDto {
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

export interface ImportRowDto {
  id: string
  importId: string
  rowNumber: number
  originalFileName: string
  fileHash: string
  certificateCode: string
  participantName: string
  documentMasked: string
  status: ImportRowStatus
  reason: string
  storedSnapshot: StoredCertificateSnapshotDto | null
  incomingData: ImportIncomingDataDto | null
  changedFields: ChangedFieldName[]
  issueCodes: ImportIssueCode[]
}

export interface ImportBatchDto {
  id: string
  originalFileName: string
  fileHash: string
  courseLocalId: string
  courseName: string
  importedBy: string
  importedAt: string
  startedAt: string | null
  completedAt: string | null
  counters: ImportCountersDto
  status: ImportBatchStatusDto
  rows: ImportRowDto[]
}

export type AuditRiskLevelDto = 'critical' | 'high' | 'medium'
export type AuditConflictStatusDto = 'pending' | 'accepted' | 'rejected'

export const auditConflictIdParamSchema = z.string().uuid()
export const auditDecisionBodySchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
  observation: z.string().trim().min(1).max(2000)
}).strict()

export type AuditDecisionBody = z.infer<typeof auditDecisionBodySchema>

export interface AuditConflictDto {
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
  storedSnapshot: StoredCertificateSnapshotDto | null
  incomingData: ImportIncomingDataDto
  documentMasked: string
  changedFields: ChangedFieldName[]
  issueCodes: ImportIssueCode[]
  riskLevel: AuditRiskLevelDto
  status: AuditConflictStatusDto
  reviewedAt: string | null
  reviewedBy: string | null
  observation: string | null
}
