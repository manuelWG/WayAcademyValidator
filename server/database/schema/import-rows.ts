import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core'
import { bytea } from './column-types'
import { certificates } from './certificates'
import { importBatches } from './import-batches'
import { importChangedFieldEnum, importIssueCodeEnum, importRowStatusEnum } from './import-enums'
import type {
  IncomingImportDataWithoutDocument,
  RawImportRowWithoutDocument,
  StoredCertificateSnapshotWithoutDocument
} from './import-json-types'

export const importRows = pgTable('import_rows', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => importBatches.id, { onDelete: 'cascade' }),
  rowNumber: integer('row_number').notNull(),
  status: importRowStatusEnum('status'),
  reason: text('reason').notNull().default(''),
  rawWithoutDocument: jsonb('raw_without_document').$type<RawImportRowWithoutDocument>().notNull(),
  documentCiphertext: bytea('document_ciphertext').notNull(),
  documentNonce: bytea('document_nonce').notNull(),
  documentAuthTag: bytea('document_auth_tag').notNull(),
  documentKeyVersion: integer('document_key_version').notNull(),
  documentLookupHmac: text('document_lookup_hmac'),
  incomingData: jsonb('incoming_data').$type<IncomingImportDataWithoutDocument>(),
  certificateCodeNormalized: text('certificate_code_normalized'),
  certificateIssueId: bigint('moodle_certificate_issue_id', { mode: 'number' }),
  storedSnapshotData: jsonb('stored_snapshot_data').$type<StoredCertificateSnapshotWithoutDocument>(),
  storedDocumentLookupHmac: text('stored_document_lookup_hmac'),
  matchedCertificateId: uuid('matched_certificate_id')
    .references((): AnyPgColumn => certificates.id, { onDelete: 'restrict' }),
  collisionByCodeCertificateId: uuid('collision_by_code_certificate_id')
    .references((): AnyPgColumn => certificates.id, { onDelete: 'restrict' }),
  collisionByIssueIdCertificateId: uuid('collision_by_issue_id_certificate_id')
    .references((): AnyPgColumn => certificates.id, { onDelete: 'restrict' }),
  changedFields: importChangedFieldEnum('changed_fields').array().notNull().default([]),
  issueCodes: importIssueCodeEnum('issue_codes').array().notNull().default([]),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
  unique('import_rows_batch_row_number_unique').on(t.batchId, t.rowNumber),
  unique('import_rows_id_batch_unique').on(t.id, t.batchId),
  index('import_rows_batch_status_row_idx').on(t.batchId, t.status, t.rowNumber),
  index('import_rows_batch_code_idx').on(t.batchId, t.certificateCodeNormalized),
  index('import_rows_batch_issue_id_idx').on(t.batchId, t.certificateIssueId),
  check('import_rows_row_number_positive', sql`${t.rowNumber} > 0`),
  check('import_rows_document_nonce_length', sql`octet_length(${t.documentNonce}) = 12`),
  check('import_rows_document_auth_tag_length', sql`octet_length(${t.documentAuthTag}) = 16`),
  check(
    'import_rows_document_key_version_range',
    sql`${t.documentKeyVersion} BETWEEN 1 AND 2147483647`
  ),
  check(
    'import_rows_document_lookup_hmac_format',
    sql`${t.documentLookupHmac} IS NULL OR ${t.documentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'import_rows_stored_document_lookup_hmac_format',
    sql`${t.storedDocumentLookupHmac} IS NULL OR ${t.storedDocumentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'import_rows_issue_id_range',
    sql`${t.certificateIssueId} IS NULL OR (${t.certificateIssueId} > 0 AND ${t.certificateIssueId} <= 9007199254740991)`
  ),
  check(
    'import_rows_match_references_shape',
    sql`(
      ${t.matchedCertificateId} IS NULL
      AND ${t.collisionByCodeCertificateId} IS NULL
      AND ${t.collisionByIssueIdCertificateId} IS NULL
    ) OR (
      ${t.matchedCertificateId} IS NOT NULL
      AND ${t.collisionByCodeCertificateId} IS NULL
      AND ${t.collisionByIssueIdCertificateId} IS NULL
    ) OR (
      ${t.matchedCertificateId} IS NULL
      AND ${t.collisionByCodeCertificateId} IS NOT NULL
      AND ${t.collisionByIssueIdCertificateId} IS NOT NULL
      AND ${t.collisionByCodeCertificateId} <> ${t.collisionByIssueIdCertificateId}
    )`
  ),
  check('import_rows_changed_fields_no_null', sql`array_position(${t.changedFields}, NULL) IS NULL`),
  check('import_rows_issue_codes_no_null', sql`array_position(${t.issueCodes}, NULL) IS NULL`),
  check(
    'import_rows_status_processed_at_sync',
    sql`(${t.status} IS NULL AND ${t.processedAt} IS NULL) OR (${t.status} IS NOT NULL AND ${t.processedAt} IS NOT NULL)`
  )
])
