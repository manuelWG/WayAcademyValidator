import type { CertificateSnapshot } from './certificate'

export type ImportBatchStatus = 'completed' | 'completed_with_conflicts' | 'failed'

export type ImportRowStatus
  = | 'new'
    | 'unchanged'
    | 'updatable'
    | 'critical_conflict'
    | 'error'

export interface ImportCounters {
  total: number
  new: number
  unchanged: number
  updatable: number
  conflicts: number
  errors: number
}

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

export interface ImportPreviewRow {
  importId: string | null
  rowNumber: number
  originalFileName: string
  fileHash: string
  certificateCode: string
  participantName: string
  documentMasked: string
  status: ImportRowStatus
  reason: string
  storedSnapshot: CertificateSnapshot | null
  incomingData: ImportIncomingData | null
  changedFields: string[]
}

export interface ImportBatch {
  id: string
  originalFileName: string
  fileHash: string
  courseLocalId: string
  courseName: string
  importedBy: string
  importedAt: string
  counters: ImportCounters
  status: ImportBatchStatus
  rows: ImportPreviewRow[]
}
