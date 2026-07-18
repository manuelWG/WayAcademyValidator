import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * SQL enum value tuples for the import/audit domain.
 *
 * These literal tuples are declared locally (not imported from
 * `shared/schemas/import`) so that `drizzle-kit generate` never has to resolve
 * the Nuxt `~~` alias while bundling the schema. Unit tests assert that these
 * values match the Phase 3A constants exactly (order included).
 */

export const IMPORT_BATCH_STATUS_VALUES = [
  'pending',
  'processing',
  'paused',
  'completed',
  'completed_with_conflicts',
  'failed'
] as const

export const IMPORT_ROW_STATUS_VALUES = [
  'new',
  'unchanged',
  'conflict',
  'critical_conflict',
  'error'
] as const

export const AUDIT_CONFLICT_STATUS_VALUES = [
  'pending',
  'accepted',
  'rejected'
] as const

export const AUDIT_RISK_LEVEL_VALUES = [
  'medium',
  'high',
  'critical'
] as const

/** Must equal IMPORT_ISSUE_CODES from Phase 3A (asserted in tests). */
export const IMPORT_ISSUE_CODE_VALUES = [
  'MISSING_FIELD',
  'INVALID_NUMBER',
  'INVALID_ISSUED_AT',
  'DUPLICATE_CERTIFICATE_CODE',
  'DUPLICATE_CERTIFICATE_ISSUE_ID',
  'COURSE_MISMATCH',
  'IDENTITY_COLLISION'
] as const

/** Must equal CHANGED_FIELDS_ORDER from Phase 3A (asserted in tests). */
export const IMPORT_CHANGED_FIELD_VALUES = [
  'certificateCode',
  'certificateIssueId',
  'certificateId',
  'courseId',
  'userId',
  'participantName',
  'documentNumberNormalized',
  'courseName',
  'issuedAt'
] as const

export const importBatchStatusEnum = pgEnum('import_batch_status', IMPORT_BATCH_STATUS_VALUES)
export const importRowStatusEnum = pgEnum('import_row_status', IMPORT_ROW_STATUS_VALUES)
export const auditConflictStatusEnum = pgEnum('audit_conflict_status', AUDIT_CONFLICT_STATUS_VALUES)
export const auditRiskLevelEnum = pgEnum('audit_risk_level', AUDIT_RISK_LEVEL_VALUES)
export const importIssueCodeEnum = pgEnum('import_issue_code', IMPORT_ISSUE_CODE_VALUES)
export const importChangedFieldEnum = pgEnum('import_changed_field', IMPORT_CHANGED_FIELD_VALUES)
