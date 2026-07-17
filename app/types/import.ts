import type { CertificateSnapshot } from './certificate'
import type { ImportIncomingData, ImportRowStatus } from '~~/shared/schemas/import'

export type { ImportIncomingData, ImportRowStatus } from '~~/shared/schemas/import'

export type ImportBatchStatus = 'completed' | 'completed_with_conflicts' | 'failed'

export interface ImportCounters {
  total: number
  new: number
  unchanged: number
  conflict: number
  criticalConflict: number
  errors: number
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
