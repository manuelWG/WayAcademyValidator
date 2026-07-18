import { and, desc, eq, inArray } from 'drizzle-orm'
import { createError } from 'h3'
import { normalizeDocument } from '~~/shared/import/normalize-document'
import type {
  AuditConflictDto,
  AuditDecisionBody,
  ImportIncomingDataDto,
  StoredCertificateSnapshotDto
} from '~~/shared/schemas/import-api'
import type { ChangedFieldName, ImportIssueCode } from '~~/shared/schemas/import'
import { useDb } from '../database/client'
import { adminUsers, auditConflicts, courses, importRows } from '../database/schema'
import type {
  IncomingImportDataWithoutDocument,
  StoredCertificateSnapshotWithoutDocument
} from '../database/schema/import-json-types'
import { decryptDocument } from '../security/document-crypto'

type AuditConflictRow = typeof auditConflicts.$inferSelect
type ImportRow = typeof importRows.$inferSelect

type AuditJoinedRow = {
  conflict: AuditConflictRow
  courseName: string
  importedBy: string
  importRow: ImportRow
}

function incomingToDto(incoming: IncomingImportDataWithoutDocument): ImportIncomingDataDto {
  return {
    participantName: incoming.participantName,
    courseName: incoming.courseName,
    courseId: incoming.courseId,
    certificateCode: incoming.certificateCode,
    certificateCodeNormalized: incoming.certificateCodeNormalized,
    issuedAt: incoming.issuedAt,
    certificateIssueId: incoming.certificateIssueId,
    certificateId: incoming.certificateId,
    userId: incoming.userId
  }
}

function snapshotToDto(
  snapshot: StoredCertificateSnapshotWithoutDocument | null
): StoredCertificateSnapshotDto | null {
  if (!snapshot) return null
  return {
    certificateCode: snapshot.certificateCode,
    certificateCodeNormalized: snapshot.certificateCodeNormalized,
    participantName: snapshot.participantName,
    courseName: snapshot.courseName,
    issuedAt: snapshot.issuedAt,
    certificateIssueId: snapshot.certificateIssueId,
    certificateId: snapshot.certificateId,
    courseId: snapshot.courseId,
    userId: snapshot.userId
  }
}

function maskDocument(value: string): string {
  const normalized = normalizeDocument(value)
  if (!normalized) return '********'
  if (normalized.length <= 2) return '*'.repeat(normalized.length)
  return `${'*'.repeat(Math.max(normalized.length - 2, 4))}${normalized.slice(-2)}`
}

function conflictToDto(row: AuditJoinedRow, reviewedBy: string | null): AuditConflictDto {
  const document = decryptDocument({
    ciphertext: row.importRow.documentCiphertext,
    nonce: row.importRow.documentNonce,
    authTag: row.importRow.documentAuthTag,
    keyVersion: row.importRow.documentKeyVersion
  }, { purpose: 'import-row-document', recordId: row.importRow.id })
  const incoming = incomingToDto(row.conflict.incomingData)

  return {
    id: row.conflict.id,
    certificateCode: incoming.certificateCode,
    courseLocalId: row.conflict.courseId,
    courseName: row.courseName,
    importId: row.conflict.importBatchId,
    originalFileName: row.conflict.originalFileName,
    fileHash: row.conflict.fileHash,
    csvRowNumber: row.conflict.csvRowNumber,
    importedBy: row.importedBy,
    detectedAt: row.conflict.detectedAt.toISOString(),
    storedSnapshot: snapshotToDto(row.conflict.storedSnapshotData ?? null),
    incomingData: incoming,
    documentMasked: maskDocument(document),
    changedFields: row.conflict.changedFields as ChangedFieldName[],
    issueCodes: row.conflict.issueCodes as ImportIssueCode[],
    riskLevel: row.conflict.riskLevel,
    status: row.conflict.status,
    reviewedAt: row.conflict.reviewedAt?.toISOString() ?? null,
    reviewedBy,
    observation: row.conflict.observation
  }
}

async function reviewedByNames(rows: AuditJoinedRow[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows
    .map(row => row.conflict.reviewedByAdminId)
    .filter((id): id is string => Boolean(id)))]
  if (ids.length === 0) return new Map()

  const reviewers = await useDb()
    .select({ id: adminUsers.id, username: adminUsers.username })
    .from(adminUsers)
    .where(inArray(adminUsers.id, ids))
  return new Map(reviewers.map(reviewer => [reviewer.id, reviewer.username]))
}

function baseAuditQuery() {
  return useDb()
    .select({
      conflict: auditConflicts,
      courseName: courses.name,
      importedBy: adminUsers.username,
      importRow: importRows
    })
    .from(auditConflicts)
    .innerJoin(courses, eq(auditConflicts.courseId, courses.id))
    .innerJoin(adminUsers, eq(auditConflicts.importedByAdminId, adminUsers.id))
    .innerJoin(importRows, and(
      eq(auditConflicts.importRowId, importRows.id),
      eq(auditConflicts.importBatchId, importRows.batchId)
    ))
}

export async function listAuditConflicts(): Promise<AuditConflictDto[]> {
  const rows = await baseAuditQuery().orderBy(desc(auditConflicts.detectedAt))
  const reviewers = await reviewedByNames(rows)
  return rows.map(row => conflictToDto(
    row,
    row.conflict.reviewedByAdminId
      ? reviewers.get(row.conflict.reviewedByAdminId) ?? null
      : null
  ))
}

export async function getAuditConflict(id: string): Promise<AuditConflictDto | null> {
  const [row] = await baseAuditQuery().where(eq(auditConflicts.id, id)).limit(1)
  if (!row) return null

  const reviewers = await reviewedByNames([row])
  return conflictToDto(
    row,
    row.conflict.reviewedByAdminId
      ? reviewers.get(row.conflict.reviewedByAdminId) ?? null
      : null
  )
}

export async function decideAuditConflict(
  id: string,
  decision: AuditDecisionBody['decision'],
  observation: string,
  reviewerAdminId: string
): Promise<AuditConflictDto> {
  const database = useDb()
  const now = new Date()
  const [updated] = await database
    .update(auditConflicts)
    .set({
      status: decision,
      reviewedAt: now,
      reviewedByAdminId: reviewerAdminId,
      observation: observation.trim(),
      updatedAt: now
    })
    .where(and(eq(auditConflicts.id, id), eq(auditConflicts.status, 'pending')))
    .returning({ id: auditConflicts.id })

  if (!updated) {
    const [existing] = await database
      .select({ status: auditConflicts.status })
      .from(auditConflicts)
      .where(eq(auditConflicts.id, id))
      .limit(1)
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Conflicto de auditoría no encontrado'
      })
    }
    if (existing.status !== decision) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'El conflicto de auditoría ya tiene una decisión diferente'
      })
    }
  }

  const result = await getAuditConflict(id)
  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Conflicto de auditoría no encontrado'
    })
  }
  return result
}
