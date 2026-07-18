import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core'
import { bytea } from './column-types'
import { courses } from './courses'
import { importRows } from './import-rows'

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceImportRowId: uuid('source_import_row_id')
    .notNull()
    .references((): AnyPgColumn => importRows.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'restrict' }),
  certificateCode: text('certificate_code').notNull(),
  certificateCodeNormalized: text('certificate_code_normalized').notNull(),
  certificateIssueId: bigint('moodle_certificate_issue_id', { mode: 'number' }).notNull(),
  certificateId: bigint('moodle_certificate_id', { mode: 'number' }).notNull(),
  moodleCourseId: bigint('moodle_course_id', { mode: 'number' }).notNull(),
  moodleUserId: bigint('moodle_user_id', { mode: 'number' }).notNull(),
  courseName: text('course_name').notNull(),
  participantName: text('participant_name').notNull(),
  documentCiphertext: bytea('document_ciphertext').notNull(),
  documentNonce: bytea('document_nonce').notNull(),
  documentAuthTag: bytea('document_auth_tag').notNull(),
  documentLookupHmac: text('document_lookup_hmac').notNull(),
  documentKeyVersion: integer('document_key_version').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
  unique('certificates_source_import_row_unique').on(t.sourceImportRowId),
  unique('certificates_certificate_code_normalized_unique').on(t.certificateCodeNormalized),
  unique('certificates_moodle_certificate_issue_id_unique').on(t.certificateIssueId),
  check(
    'certificates_moodle_certificate_issue_id_range',
    sql`${t.certificateIssueId} > 0 AND ${t.certificateIssueId} <= 9007199254740991`
  ),
  check(
    'certificates_moodle_certificate_id_range',
    sql`${t.certificateId} > 0 AND ${t.certificateId} <= 9007199254740991`
  ),
  check(
    'certificates_moodle_course_id_range',
    sql`${t.moodleCourseId} > 0 AND ${t.moodleCourseId} <= 9007199254740991`
  ),
  check(
    'certificates_moodle_user_id_range',
    sql`${t.moodleUserId} > 0 AND ${t.moodleUserId} <= 9007199254740991`
  ),
  check(
    'certificates_certificate_code_normalized_not_empty',
    sql`char_length(${t.certificateCodeNormalized}) > 0`
  ),
  check('certificates_document_nonce_length', sql`octet_length(${t.documentNonce}) = 12`),
  check('certificates_document_auth_tag_length', sql`octet_length(${t.documentAuthTag}) = 16`),
  check('certificates_document_ciphertext_length', sql`octet_length(${t.documentCiphertext}) > 0`),
  check(
    'certificates_document_lookup_hmac_format',
    sql`${t.documentLookupHmac} ~ '^[0-9a-f]{64}$'`
  ),
  check(
    'certificates_document_key_version_range',
    sql`${t.documentKeyVersion} BETWEEN 1 AND 2147483647`
  ),
  index('certificates_document_lookup_hmac_idx').on(t.documentLookupHmac),
  index('certificates_course_id_idx').on(t.courseId)
])
