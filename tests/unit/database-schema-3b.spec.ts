import { readdirSync, readFileSync } from 'node:fs'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { CHANGED_FIELDS_ORDER, IMPORT_ISSUE_CODES } from '~~/shared/schemas/import'
import * as schema from '../../server/database/schema'
import {
  auditConflictStatusEnum,
  auditRiskLevelEnum,
  importBatchStatusEnum,
  importChangedFieldEnum,
  importIssueCodeEnum,
  importRowStatusEnum
} from '../../server/database/schema/import-enums'
import {
  FORBIDDEN_DOCUMENT_KEYS,
  hasExactKeys,
  hasNoDocumentKeys,
  INCOMING_IMPORT_DATA_WITHOUT_DOCUMENT_KEYS,
  RAW_IMPORT_ROW_WITHOUT_DOCUMENT_KEYS,
  STORED_CERTIFICATE_SNAPSHOT_WITHOUT_DOCUMENT_KEYS
} from '../../server/database/schema/import-json-types'

function columnMap(table: Parameters<typeof getTableConfig>[0]) {
  const config = getTableConfig(table)
  return new Map(config.columns.map(column => [column.name, column]))
}

const MIGRATIONS_DIR = 'server/database/migrations'
const migrationFile = readdirSync(MIGRATIONS_DIR).find(f => f.startsWith('0001_') && f.endsWith('.sql'))
const migrationSql = migrationFile ? readFileSync(`${MIGRATIONS_DIR}/${migrationFile}`, 'utf8') : ''

describe('phase 3B schema — exports and enums', () => {
  it('exports the base tables plus the four new tables', () => {
    expect(schema.adminUsers).toBeDefined()
    expect(schema.courses).toBeDefined()
    expect(schema.certificates).toBeDefined()
    expect(schema.importBatches).toBeDefined()
    expect(schema.importRows).toBeDefined()
    expect(schema.auditConflicts).toBeDefined()
  })

  it('aligns issue-code and changed-field enums exactly with Phase 3A', () => {
    expect(importIssueCodeEnum.enumValues).toEqual([...IMPORT_ISSUE_CODES])
    expect(importChangedFieldEnum.enumValues).toEqual([...CHANGED_FIELDS_ORDER])
  })

  it('declares the remaining enums exactly', () => {
    expect(importRowStatusEnum.enumValues).toEqual([
      'new', 'unchanged', 'conflict', 'critical_conflict', 'error'
    ])
    expect(importBatchStatusEnum.enumValues).toEqual([
      'pending', 'processing', 'paused', 'completed', 'completed_with_conflicts', 'failed'
    ])
    expect(auditConflictStatusEnum.enumValues).toEqual(['pending', 'accepted', 'rejected'])
    expect(auditRiskLevelEnum.enumValues).toEqual(['medium', 'high', 'critical'])
  })
})

describe('phase 3B schema — certificates metadata', () => {
  const columns = columnMap(schema.certificates)
  const config = getTableConfig(schema.certificates)

  it('has no public_visible column', () => {
    expect(columns.has('public_visible')).toBe(false)
  })

  it('stores Moodle ids as bigint and key version as integer', () => {
    expect(columns.get('moodle_certificate_issue_id')?.getSQLType()).toBe('bigint')
    expect(columns.get('moodle_certificate_id')?.getSQLType()).toBe('bigint')
    expect(columns.get('moodle_course_id')?.getSQLType()).toBe('bigint')
    expect(columns.get('moodle_user_id')?.getSQLType()).toBe('bigint')
    expect(columns.get('document_key_version')?.getSQLType()).toBe('integer')
  })

  it('stores document payload as bytea and requires source_import_row_id', () => {
    expect(columns.get('document_ciphertext')?.getSQLType()).toBe('bytea')
    expect(columns.get('document_nonce')?.getSQLType()).toBe('bytea')
    expect(columns.get('document_auth_tag')?.getSQLType()).toBe('bytea')
    const sourceRow = columns.get('source_import_row_id')
    expect(sourceRow?.getSQLType()).toBe('uuid')
    expect(sourceRow?.notNull).toBe(true)
  })

  it('declares source-row uniqueness and the key-version range check', () => {
    const uniqueNames = config.uniqueConstraints.map(u => u.name)
    expect(uniqueNames).toContain('certificates_source_import_row_unique')
    const checkNames = config.checks.map(c => c.name)
    expect(checkNames).toContain('certificates_document_key_version_range')
  })
})

describe('phase 3B schema — import_rows metadata', () => {
  const columns = columnMap(schema.importRows)

  it('keeps status nullable (staging) and code/issue optional', () => {
    expect(columns.get('status')?.notNull).toBe(false)
    expect(columns.get('certificate_code_normalized')?.notNull).toBe(false)
    expect(columns.get('moodle_certificate_issue_id')?.notNull).toBe(false)
  })

  it('requires non-null typed arrays and the raw JSONB payload', () => {
    expect(columns.get('changed_fields')?.notNull).toBe(true)
    expect(columns.get('issue_codes')?.notNull).toBe(true)
    expect(columns.get('raw_without_document')?.notNull).toBe(true)
  })
})

describe('phase 3B — generated SQL patterns (local artifact, not a live insert)', () => {
  it('generated a 0001 migration and left 0000 untouched', () => {
    expect(migrationFile).toBeTruthy()
    expect(migrationSql.length).toBeGreaterThan(0)
    expect(readdirSync(MIGRATIONS_DIR)).toContain('0000_phase2_admin_courses.sql')
  })

  it('uses an exact, null-safe audit shape check without ANY()', () => {
    expect(migrationSql).toContain(
      `"issue_codes" = ARRAY['IDENTITY_COLLISION']::import_issue_code[]`
    )
    expect(migrationSql).toContain('cardinality("audit_conflicts"."changed_fields") > 0')
    expect(migrationSql).toContain('cardinality("audit_conflicts"."issue_codes") = 0')
    expect(migrationSql).not.toMatch(/ANY\s*\(/)
  })

  it('guards arrays against null elements in both tables', () => {
    expect(migrationSql).toContain('array_position("import_rows"."changed_fields", NULL) IS NULL')
    expect(migrationSql).toContain('array_position("import_rows"."issue_codes", NULL) IS NULL')
    expect(migrationSql).toContain('array_position("audit_conflicts"."changed_fields", NULL) IS NULL')
    expect(migrationSql).toContain('array_position("audit_conflicts"."issue_codes", NULL) IS NULL')
  })

  it('encodes the failed pre-start vs partial batch invariant', () => {
    expect(migrationSql).toContain(`"import_batches"."status" = 'failed'`)
    expect(migrationSql).toMatch(/failed[\s\S]*?"import_batches"\."started_at" IS NULL[\s\S]*?"import_batches"\."processed_rows" = 0/)
    expect(migrationSql).toMatch(/failed[\s\S]*?"import_batches"\."started_at" IS NOT NULL/)
  })

  it('bounds the key version to the PostgreSQL integer range with a literal', () => {
    expect(migrationSql).toContain('"certificates"."document_key_version" BETWEEN 1 AND 2147483647')
    expect(migrationSql).toContain('"import_rows"."document_key_version" BETWEEN 1 AND 2147483647')
    expect(migrationSql).toContain('<= 9007199254740991')
    expect(migrationSql).not.toContain('<= $1')
  })

  it('creates the partial active-attempt unique index and the retry chain FK', () => {
    expect(migrationSql).toContain('CREATE UNIQUE INDEX "import_batches_one_active_attempt_unique"')
    expect(migrationSql).toContain(`WHERE "import_batches"."status" IN ('pending', 'processing', 'paused')`)
    expect(migrationSql).toContain('CREATE UNIQUE INDEX "import_batches_retry_of_unique"')
    expect(migrationSql).toContain(
      '"import_batches_retry_parent_fk" FOREIGN KEY ("retry_of_batch_id","course_id","file_hash") REFERENCES "public"."import_batches"("id","course_id","file_hash")'
    )
  })

  it('resolves the certificates/import_rows FK cycle via ALTER TABLE after both tables exist', () => {
    const createCertificates = migrationSql.indexOf('CREATE TABLE "certificates"')
    const createImportRows = migrationSql.indexOf('CREATE TABLE "import_rows"')
    const alterSourceFk = migrationSql.indexOf('"certificates_source_import_row_id_import_rows_id_fk"')
    const alterMatchedFk = migrationSql.indexOf('"import_rows_matched_certificate_id_certificates_id_fk"')

    expect(createCertificates).toBeGreaterThanOrEqual(0)
    expect(createImportRows).toBeGreaterThanOrEqual(0)
    expect(alterSourceFk).toBeGreaterThan(createCertificates)
    expect(alterSourceFk).toBeGreaterThan(createImportRows)
    expect(alterMatchedFk).toBeGreaterThan(createCertificates)
    expect(alterMatchedFk).toBeGreaterThan(createImportRows)
  })

  it('keeps the source FK restrictive and unique', () => {
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "certificates_source_import_row_id_import_rows_id_fk" FOREIGN KEY ("source_import_row_id") REFERENCES "public"."import_rows"("id") ON DELETE restrict'
    )
    expect(migrationSql).toContain('"certificates_source_import_row_unique" UNIQUE("source_import_row_id")')
  })

  it('contains no destructive statements, secrets or URLs', () => {
    expect(migrationSql).not.toMatch(/DROP\s+TABLE/i)
    expect(migrationSql).not.toMatch(/postgres(ql)?:\/\//i)
    expect(migrationSql).not.toContain('DATABASE_URL')
  })

  it('encodes ExistingCertificateMatch as three exclusive match-reference shapes (SQL metadata only)', () => {
    expect(migrationSql).toContain('CONSTRAINT "import_rows_match_references_shape"')
    expect(migrationSql).not.toContain('import_rows_collision_pair_shape')

    // none: all three references null
    expect(migrationSql).toMatch(
      /"import_rows"\."matched_certificate_id" IS NULL\s+AND "import_rows"\."collision_by_code_certificate_id" IS NULL\s+AND "import_rows"\."collision_by_issue_id_certificate_id" IS NULL/
    )
    // same_certificate: matched set, collisions null
    expect(migrationSql).toMatch(
      /"import_rows"\."matched_certificate_id" IS NOT NULL\s+AND "import_rows"\."collision_by_code_certificate_id" IS NULL\s+AND "import_rows"\."collision_by_issue_id_certificate_id" IS NULL/
    )
    // identity_collision: matched null, both collisions set and distinct
    expect(migrationSql).toMatch(
      /"import_rows"\."matched_certificate_id" IS NULL\s+AND "import_rows"\."collision_by_code_certificate_id" IS NOT NULL\s+AND "import_rows"\."collision_by_issue_id_certificate_id" IS NOT NULL\s+AND "import_rows"\."collision_by_code_certificate_id" <> "import_rows"\."collision_by_issue_id_certificate_id"/
    )
  })
})

describe('phase 3B — JSONB contracts carry no document', () => {
  it('allow-lists exclude any document key', () => {
    const allLists = [
      RAW_IMPORT_ROW_WITHOUT_DOCUMENT_KEYS,
      INCOMING_IMPORT_DATA_WITHOUT_DOCUMENT_KEYS,
      STORED_CERTIFICATE_SNAPSHOT_WITHOUT_DOCUMENT_KEYS
    ]
    for (const list of allLists) {
      for (const forbidden of FORBIDDEN_DOCUMENT_KEYS) {
        expect(list as readonly string[]).not.toContain(forbidden)
      }
    }
  })

  it('hasNoDocumentKeys and hasExactKeys behave as pure guards', () => {
    expect(hasNoDocumentKeys({ participantName: 'x', courseName: 'y' })).toBe(true)
    expect(hasNoDocumentKeys({ documentNumber: '123' })).toBe(false)
    expect(hasNoDocumentKeys({ documentNumberNormalized: '123' })).toBe(false)
    expect(hasExactKeys({ a: 1, b: 2 }, ['a', 'b'])).toBe(true)
    expect(hasExactKeys({ a: 1 }, ['a', 'b'])).toBe(false)
    expect(hasExactKeys({ a: 1, c: 3 }, ['a', 'b'])).toBe(false)
  })
})
