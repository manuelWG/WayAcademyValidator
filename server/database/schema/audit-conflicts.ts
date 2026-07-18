import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core'
import { adminUsers } from './admin-users'
import { certificates } from './certificates'
import { courses } from './courses'
import { auditConflictStatusEnum, auditRiskLevelEnum, importChangedFieldEnum, importIssueCodeEnum } from './import-enums'
import { importRows } from './import-rows'
import type {
  IncomingImportDataWithoutDocument,
  StoredCertificateSnapshotWithoutDocument
} from './import-json-types'

export const auditConflicts = pgTable('audit_conflicts', {
  id: uuid('id').defaultRandom().primaryKey(),
  importBatchId: uuid('import_batch_id').notNull(),
  importRowId: uuid('import_row_id').notNull(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'restrict' }),
  certificateId: uuid('certificate_id')
    .references(() => certificates.id, { onDelete: 'restrict' }),
  collisionByCodeCertificateId: uuid('collision_by_code_certificate_id')
    .references(() => certificates.id, { onDelete: 'restrict' }),
  collisionByIssueIdCertificateId: uuid('collision_by_issue_id_certificate_id')
    .references(() => certificates.id, { onDelete: 'restrict' }),
  originalFileName: text('original_file_name').notNull(),
  fileHash: text('file_hash').notNull(),
  csvRowNumber: integer('csv_row_number').notNull(),
  importedByAdminId: uuid('imported_by_admin_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'restrict' }),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  storedSnapshotData: jsonb('stored_snapshot_data').$type<StoredCertificateSnapshotWithoutDocument>(),
  storedDocumentLookupHmac: text('stored_document_lookup_hmac'),
  collisionByCodeSnapshotData: jsonb('collision_by_code_snapshot_data').$type<StoredCertificateSnapshotWithoutDocument>(),
  collisionByCodeDocumentLookupHmac: text('collision_by_code_document_lookup_hmac'),
  collisionByIssueIdSnapshotData: jsonb('collision_by_issue_id_snapshot_data').$type<StoredCertificateSnapshotWithoutDocument>(),
  collisionByIssueIdDocumentLookupHmac: text('collision_by_issue_id_document_lookup_hmac'),
  incomingData: jsonb('incoming_data').$type<IncomingImportDataWithoutDocument>().notNull(),
  incomingDocumentLookupHmac: text('incoming_document_lookup_hmac').notNull(),
  changedFields: importChangedFieldEnum('changed_fields').array().notNull().default([]),
  issueCodes: importIssueCodeEnum('issue_codes').array().notNull().default([]),
  riskLevel: auditRiskLevelEnum('risk_level').notNull(),
  status: auditConflictStatusEnum('status').notNull().default('pending'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedByAdminId: uuid('reviewed_by_admin_id')
    .references(() => adminUsers.id, { onDelete: 'restrict' }),
  observation: text('observation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
  foreignKey({
    name: 'audit_conflicts_import_row_fk',
    columns: [t.importRowId, t.importBatchId],
    foreignColumns: [importRows.id, importRows.batchId]
  }).onDelete('restrict'),
  unique('audit_conflicts_import_row_unique').on(t.importRowId),
  index('audit_conflicts_status_detected_at_idx').on(t.status, t.detectedAt),
  index('audit_conflicts_course_status_idx').on(t.courseId, t.status),
  index('audit_conflicts_import_batch_idx').on(t.importBatchId),
  check('audit_conflicts_csv_row_number_positive', sql`${t.csvRowNumber} > 0`),
  check('audit_conflicts_original_file_name_not_empty', sql`btrim(${t.originalFileName}) <> ''`),
  check('audit_conflicts_file_hash_format', sql`${t.fileHash} ~ '^[0-9a-f]{64}$'`),
  check(
    'audit_conflicts_incoming_hmac_format',
    sql`${t.incomingDocumentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'audit_conflicts_stored_hmac_format',
    sql`${t.storedDocumentLookupHmac} IS NULL OR ${t.storedDocumentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'audit_conflicts_collision_by_code_hmac_format',
    sql`${t.collisionByCodeDocumentLookupHmac} IS NULL OR ${t.collisionByCodeDocumentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'audit_conflicts_collision_by_issue_id_hmac_format',
    sql`${t.collisionByIssueIdDocumentLookupHmac} IS NULL OR ${t.collisionByIssueIdDocumentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check('audit_conflicts_changed_fields_no_null', sql`array_position(${t.changedFields}, NULL) IS NULL`),
  check('audit_conflicts_issue_codes_no_null', sql`array_position(${t.issueCodes}, NULL) IS NULL`),
  check(
    'audit_conflicts_review_shape',
    sql`(
      ${t.status} = 'pending' AND ${t.reviewedAt} IS NULL AND ${t.reviewedByAdminId} IS NULL
    ) OR (
      ${t.status} IN ('accepted', 'rejected')
      AND ${t.reviewedAt} IS NOT NULL
      AND ${t.reviewedByAdminId} IS NOT NULL
    )`
  ),
  check(
    'audit_conflicts_shape_check',
    sql`(
      ${t.certificateId} IS NOT NULL
      AND ${t.storedSnapshotData} IS NOT NULL
      AND ${t.storedDocumentLookupHmac} IS NOT NULL
      AND ${t.collisionByCodeCertificateId} IS NULL
      AND ${t.collisionByIssueIdCertificateId} IS NULL
      AND ${t.collisionByCodeSnapshotData} IS NULL
      AND ${t.collisionByIssueIdSnapshotData} IS NULL
      AND ${t.collisionByCodeDocumentLookupHmac} IS NULL
      AND ${t.collisionByIssueIdDocumentLookupHmac} IS NULL
      AND cardinality(${t.changedFields}) > 0
      AND cardinality(${t.issueCodes}) = 0
    ) OR (
      ${t.certificateId} IS NULL
      AND ${t.storedSnapshotData} IS NULL
      AND ${t.storedDocumentLookupHmac} IS NULL
      AND ${t.collisionByCodeCertificateId} IS NOT NULL
      AND ${t.collisionByIssueIdCertificateId} IS NOT NULL
      AND ${t.collisionByCodeCertificateId} <> ${t.collisionByIssueIdCertificateId}
      AND ${t.collisionByCodeSnapshotData} IS NOT NULL
      AND ${t.collisionByIssueIdSnapshotData} IS NOT NULL
      AND ${t.collisionByCodeDocumentLookupHmac} IS NOT NULL
      AND ${t.collisionByIssueIdDocumentLookupHmac} IS NOT NULL
      AND cardinality(${t.changedFields}) = 0
      AND ${t.issueCodes} = ARRAY['IDENTITY_COLLISION']::import_issue_code[]
    )`
  )
])
