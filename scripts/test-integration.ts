/**
 * Full import/audit integration flow against a dedicated Neon test branch.
 * Requires DATABASE_URL_TEST explicitly and never falls back to DATABASE_URL.
 *
 * Cleanup deletes only rows related to the unique course/admin created by this run.
 * It never drops, truncates, migrates or resets a schema.
 */
import 'dotenv/config'
import { randomInt } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, inArray } from 'drizzle-orm'
import {
  adminUsers,
  auditConflicts,
  certificates,
  courses,
  importBatches,
  importRows
} from '../server/database/schema'
import { hashAdminPassword } from '../server/utils/password'

const PREFIX = `it_${Date.now()}_${randomInt(1_000_000)}_`
const CSV_HEADER = [
  'certificate_issue_id',
  'certificate_code',
  'certificate_id',
  'course_id',
  'course_name',
  'user_id',
  'participant_name',
  'document_number',
  'issued_at_unix'
].join(',')

function normalizedDatabaseTarget(value: string): string {
  const parsed = new URL(value)
  return [
    parsed.protocol,
    parsed.hostname.replace('-pooler.', '.'),
    parsed.port,
    parsed.pathname,
    parsed.username
  ].join('|')
}

function assertDedicatedTestTarget(testUrl: string): void {
  let testTarget: string
  try {
    testTarget = normalizedDatabaseTarget(testUrl)
  } catch {
    throw new Error('DATABASE_URL_TEST is not a valid database URL')
  }

  const devUrl = process.env.DATABASE_URL?.trim()
  if (devUrl) {
    let devTarget: string
    try {
      devTarget = normalizedDatabaseTarget(devUrl)
    } catch {
      throw new Error('DATABASE_URL is invalid; cannot prove test/dev target separation')
    }
    if (testTarget === devTarget) {
      throw new Error('DATABASE_URL_TEST resolves to the same target as DATABASE_URL; refusing to run')
    }
  }
}

async function confirmIfNeeded() {
  if (process.env.INTEGRATION_TEST_CONFIRM === 'YES') return
  if (!input.isTTY || !output.isTTY) {
    throw new Error('Set INTEGRATION_TEST_CONFIRM=YES to authorize temporary writes to DATABASE_URL_TEST')
  }
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(
      'This will write temporary rows to DATABASE_URL_TEST (confirm with YES): '
    )
    if (answer.trim() !== 'YES') throw new Error('Aborted by user')
  } finally {
    rl.close()
  }
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csv(rows: Array<Array<string | number>>): Buffer {
  return Buffer.from([
    CSV_HEADER,
    ...rows.map(row => row.map(csvCell).join(','))
  ].join('\r\n'), 'utf8')
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertNoClearDocument(value: unknown, clearDocuments: string[]): void {
  const forbiddenKeys = new Set([
    'documentNumber',
    'documentNumberNormalized',
    'document_number'
  ])
  const visit = (current: unknown): void => {
    if (typeof current === 'string') {
      assert(!clearDocuments.includes(current), 'API DTO exposed a clear document value')
      return
    }
    if (Array.isArray(current)) {
      current.forEach(visit)
      return
    }
    if (current && typeof current === 'object') {
      for (const [key, nested] of Object.entries(current)) {
        assert(!forbiddenKeys.has(key), `API DTO exposed forbidden key: ${key}`)
        visit(nested)
      }
    }
  }
  visit(value)
}

async function main() {
  const testUrl = process.env.DATABASE_URL_TEST?.trim()
  if (!testUrl) {
    throw new Error('DATABASE_URL_TEST is required. No fallback to DATABASE_URL.')
  }
  assertDedicatedTestTarget(testUrl)
  await confirmIfNeeded()

  // Backend services resolve DATABASE_URL lazily. Override it in this process only,
  // after proving that the explicit test target differs from the dev target.
  process.env.DATABASE_URL = testUrl
  console.log('Integration target verified: dedicated DATABASE_URL_TEST (credentials hidden).')

  const sqlClient = neon(testUrl)
  const db = drizzle(sqlClient, {
    schema: { adminUsers, auditConflicts, certificates, courses, importBatches, importRows }
  })

  // Read-only readiness check. The script intentionally never applies migrations.
  await Promise.all([
    db.select({ id: adminUsers.id }).from(adminUsers).limit(0),
    db.select({ id: courses.id }).from(courses).limit(0),
    db.select({ id: importBatches.id }).from(importBatches).limit(0),
    db.select({ id: importRows.id }).from(importRows).limit(0),
    db.select({ id: certificates.id }).from(certificates).limit(0),
    db.select({ id: auditConflicts.id }).from(auditConflicts).limit(0)
  ])

  const { resetDbClientForTests } = await import('../server/database/client')
  const {
    confirmImportBatch,
    createImportBatch,
    getImportBatch
  } = await import('../server/services/imports.service')
  const {
    decideAuditConflict,
    getAuditConflict
  } = await import('../server/services/audit.service')
  resetDbClientForTests()

  let createdAdminId: string | null = null
  let createdCourseId: string | null = null
  let testError: unknown
  const cleanupFailures: string[] = []

  try {
    const username = `${PREFIX}admin`.slice(0, 64)
    const moodleCourseId = randomInt(1_000_000_000, 1_500_000_000)
    const seedIssueId = randomInt(1_500_000_001, 1_700_000_000)
    const newIssueId = randomInt(1_700_000_001, 1_900_000_000)
    const seedDocument = `${randomInt(10_000_000, 99_999_999)}`
    const newDocument = `${randomInt(10_000_000, 99_999_999)}`
    const courseName = `${PREFIX}course`

    const passwordHash = await hashAdminPassword('Integration1Pass')
    const [admin] = await db.insert(adminUsers).values({
      username,
      displayName: 'Integration Admin',
      passwordHash
    }).returning({ id: adminUsers.id })
    assert(admin, 'Admin insert failed')
    createdAdminId = admin.id

    const [course] = await db.insert(courses).values({
      moodleCourseId,
      name: courseName,
      notes: '',
      isPublished: false
    }).returning({ id: courses.id })
    assert(course, 'Course insert failed')
    createdCourseId = course.id

    // First real import creates the stored certificate used by the conflict scenario.
    const seedBatch = await createImportBatch({
      fileName: `${PREFIX}seed.csv`,
      data: csv([[
        seedIssueId, `${PREFIX}seed-code`, seedIssueId + 1, moodleCourseId,
        courseName, seedIssueId + 2, 'Original Participant', seedDocument, 1704067200
      ]])
    }, course.id, admin.id)
    assert(seedBatch.status === 'paused', 'Seed import did not reach paused preview state')
    assertNoClearDocument(seedBatch, [seedDocument])
    const seeded = await confirmImportBatch(seedBatch.id, admin.id)
    assert(seeded.status === 'completed', 'Seed import did not complete')

    // Main flow: one new certificate and one changed snapshot conflict.
    const mainBatch = await createImportBatch({
      fileName: `${PREFIX}main.csv`,
      data: csv([
        [
          seedIssueId, `${PREFIX}seed-code`, seedIssueId + 3, moodleCourseId,
          courseName, seedIssueId + 2, 'Original Participant', seedDocument, 1704067200
        ],
        [
          newIssueId, `${PREFIX}new-code`, newIssueId + 1, moodleCourseId,
          courseName, newIssueId + 2, 'New Participant', newDocument, 1704153600
        ]
      ])
    }, course.id, admin.id)

    assert(mainBatch.status === 'paused', 'Main import did not reach paused preview state')
    assert(mainBatch.counters.total === 2, 'Preview total does not match the uploaded CSV')
    assert(mainBatch.counters.new === 1, 'Preview did not classify the new certificate')
    assert(mainBatch.counters.conflict === 1, 'Preview did not classify the audit conflict')
    assertNoClearDocument(mainBatch, [seedDocument, newDocument])

    const confirmed = await confirmImportBatch(mainBatch.id, admin.id)
    assert(confirmed.status === 'completed_with_conflicts', 'Main batch terminal state is incorrect')
    assert(confirmed.completedAt, 'Confirmed batch has no completion timestamp')
    assertNoClearDocument(confirmed, [seedDocument, newDocument])

    const preview = await getImportBatch(mainBatch.id)
    assert(preview?.rows.length === 2, 'Persisted preview rows are missing')
    assertNoClearDocument(preview, [seedDocument, newDocument])

    const createdCertificates = await db.select({ id: certificates.id })
      .from(certificates)
      .where(eq(certificates.courseId, course.id))
    assert(createdCertificates.length === 2, 'Expected exactly two certificates created by the test')

    const conflicts = await db.select({ id: auditConflicts.id })
      .from(auditConflicts)
      .where(eq(auditConflicts.importBatchId, mainBatch.id))
    assert(conflicts.length === 1, 'Expected exactly one audit conflict')

    const conflict = await getAuditConflict(conflicts[0]!.id)
    assert(conflict?.status === 'pending', 'Audit conflict was not created as pending')
    assertNoClearDocument(conflict, [seedDocument, newDocument])

    const decided = await decideAuditConflict(
      conflicts[0]!.id,
      'accepted',
      'Verified by integration test',
      admin.id
    )
    assert(decided.status === 'accepted', 'Audit decision was not persisted')
    assert(decided.reviewedBy === username, 'Audit reviewer was not returned')
    assert(decided.observation === 'Verified by integration test', 'Audit observation was not persisted')
    assertNoClearDocument(decided, [seedDocument, newDocument])

    console.log('Integration flow passed: upload, preview, confirm, certificates, audit and decision.')
  } catch (error) {
    testError = error
  } finally {
    // Resolve children from the unique course created by this run, then delete in FK-safe order.
    const cleanup = async (label: string, action: () => Promise<unknown>) => {
      try {
        await action()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        cleanupFailures.push(`${label}: ${message}`)
      }
    }

    if (createdCourseId) {
      const batchRows = await db.select({ id: importBatches.id })
        .from(importBatches)
        .where(eq(importBatches.courseId, createdCourseId))
      const batchIds = batchRows.map(row => row.id)
      await cleanup('audit conflicts', () => db.delete(auditConflicts).where(eq(auditConflicts.courseId, createdCourseId!)))
      if (batchIds.length > 0) {
        await cleanup('import row certificate references', () => db.update(importRows).set({
          matchedCertificateId: null,
          collisionByCodeCertificateId: null,
          collisionByIssueIdCertificateId: null
        }).where(inArray(importRows.batchId, batchIds)))
      }
      await cleanup('certificates', () => db.delete(certificates).where(eq(certificates.courseId, createdCourseId!)))
      if (batchIds.length > 0) {
        await cleanup('import rows', () => db.delete(importRows).where(inArray(importRows.batchId, batchIds)))
      }
      await cleanup('import batches', () => db.delete(importBatches).where(eq(importBatches.courseId, createdCourseId!)))
      await cleanup('course', () => db.delete(courses).where(eq(courses.id, createdCourseId!)))
    }
    if (createdAdminId) {
      await cleanup('admin', () => db.delete(adminUsers).where(eq(adminUsers.id, createdAdminId!)))
    }

    if (cleanupFailures.length === 0 && (createdCourseId || createdAdminId)) {
      console.log('Integration cleanup finished for this run\'s tracked data only.')
    }
  }

  if (testError) throw testError
  if (cleanupFailures.length > 0) {
    throw new Error(`Integration cleanup failed: ${cleanupFailures.join('; ')}`)
  }
}

main().catch((error) => {
  console.error('Integration test failed.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
