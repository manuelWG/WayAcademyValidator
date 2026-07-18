import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import { adminUsers } from './admin-users'
import { courses } from './courses'
import { importBatchStatusEnum } from './import-enums'

export const importBatches = pgTable('import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'restrict' }),
  createdByAdminId: uuid('created_by_admin_id')
    .notNull()
    .references(() => adminUsers.id, { onDelete: 'restrict' }),
  originalFileName: text('original_file_name').notNull(),
  fileHash: text('file_hash').notNull(),
  attemptNumber: integer('attempt_number').notNull().default(1),
  retryOfBatchId: uuid('retry_of_batch_id'),
  retryAuthorizedByAdminId: uuid('retry_authorized_by_admin_id')
    .references(() => adminUsers.id, { onDelete: 'restrict' }),
  retryAuthorizedAt: timestamp('retry_authorized_at', { withTimezone: true }),
  retryReason: text('retry_reason'),
  status: importBatchStatusEnum('status').notNull().default('pending'),
  total: integer('total_count').notNull().default(0),
  newCount: integer('new_count').notNull().default(0),
  unchangedCount: integer('unchanged_count').notNull().default(0),
  conflictCount: integer('conflict_count').notNull().default(0),
  criticalConflictCount: integer('critical_conflict_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  processedRows: integer('processed_rows').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
  unique('import_batches_course_hash_attempt_unique').on(t.courseId, t.fileHash, t.attemptNumber),
  unique('import_batches_id_course_hash_unique').on(t.id, t.courseId, t.fileHash),
  foreignKey({
    name: 'import_batches_retry_parent_fk',
    columns: [t.retryOfBatchId, t.courseId, t.fileHash],
    foreignColumns: [t.id, t.courseId, t.fileHash]
  }).onDelete('restrict'),
  uniqueIndex('import_batches_retry_of_unique')
    .on(t.retryOfBatchId)
    .where(sql`${t.retryOfBatchId} IS NOT NULL`),
  uniqueIndex('import_batches_one_active_attempt_unique')
    .on(t.courseId, t.fileHash)
    .where(sql`${t.status} IN ('pending', 'processing', 'paused')`),
  index('import_batches_status_updated_at_idx').on(t.status, t.updatedAt),
  index('import_batches_course_created_at_idx').on(t.courseId, t.createdAt),
  index('import_batches_course_hash_status_idx').on(t.courseId, t.fileHash, t.status),
  check('import_batches_attempt_number_positive', sql`${t.attemptNumber} > 0`),
  check('import_batches_file_hash_format', sql`${t.fileHash} ~ '^[0-9a-f]{64}$'`),
  check('import_batches_original_file_name_not_empty', sql`btrim(${t.originalFileName}) <> ''`),
  check(
    'import_batches_retry_shape',
    sql`(
      ${t.attemptNumber} = 1
      AND ${t.retryOfBatchId} IS NULL
      AND ${t.retryAuthorizedByAdminId} IS NULL
      AND ${t.retryAuthorizedAt} IS NULL
      AND ${t.retryReason} IS NULL
    ) OR (
      ${t.attemptNumber} > 1
      AND ${t.retryOfBatchId} IS NOT NULL
      AND ${t.retryAuthorizedByAdminId} IS NOT NULL
      AND ${t.retryAuthorizedAt} IS NOT NULL
      AND ${t.retryReason} IS NOT NULL
      AND btrim(${t.retryReason}) <> ''
    )`
  ),
  check(
    'import_batches_counters_non_negative',
    sql`
      ${t.total} >= 0
      AND ${t.newCount} >= 0
      AND ${t.unchangedCount} >= 0
      AND ${t.conflictCount} >= 0
      AND ${t.criticalConflictCount} >= 0
      AND ${t.errorCount} >= 0
      AND ${t.processedRows} >= 0
    `
  ),
  check('import_batches_processed_within_total', sql`${t.processedRows} <= ${t.total}`),
  check(
    'import_batches_processed_sum',
    sql`${t.processedRows} = ${t.newCount} + ${t.unchangedCount} + ${t.conflictCount} + ${t.criticalConflictCount} + ${t.errorCount}`
  ),
  check(
    'import_batches_status_shape',
    sql`(
      ${t.status} = 'pending'
      AND ${t.startedAt} IS NULL
      AND ${t.completedAt} IS NULL
      AND ${t.processedRows} = 0
      AND ${t.newCount} = 0
      AND ${t.unchangedCount} = 0
      AND ${t.conflictCount} = 0
      AND ${t.criticalConflictCount} = 0
      AND ${t.errorCount} = 0
    ) OR (
      ${t.status} = 'processing'
      AND ${t.startedAt} IS NOT NULL
      AND ${t.completedAt} IS NULL
      AND ${t.total} > 0
    ) OR (
      ${t.status} = 'paused'
      AND ${t.startedAt} IS NOT NULL
      AND ${t.completedAt} IS NULL
      AND ${t.total} > 0
    ) OR (
      ${t.status} = 'completed'
      AND ${t.startedAt} IS NOT NULL
      AND ${t.completedAt} IS NOT NULL
      AND ${t.total} > 0
      AND ${t.processedRows} = ${t.total}
      AND ${t.conflictCount} = 0
      AND ${t.criticalConflictCount} = 0
      AND ${t.errorCount} = 0
    ) OR (
      ${t.status} = 'completed_with_conflicts'
      AND ${t.startedAt} IS NOT NULL
      AND ${t.completedAt} IS NOT NULL
      AND ${t.total} > 0
      AND ${t.processedRows} = ${t.total}
      AND (${t.conflictCount} > 0 OR ${t.criticalConflictCount} > 0 OR ${t.errorCount} > 0)
    ) OR (
      ${t.status} = 'failed'
      AND ${t.completedAt} IS NOT NULL
      AND (
        (
          ${t.startedAt} IS NULL
          AND ${t.processedRows} = 0
          AND ${t.newCount} = 0
          AND ${t.unchangedCount} = 0
          AND ${t.conflictCount} = 0
          AND ${t.criticalConflictCount} = 0
          AND ${t.errorCount} = 0
        ) OR (
          ${t.startedAt} IS NOT NULL
        )
      )
    )`
  )
])
