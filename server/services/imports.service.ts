import { createHash, randomUUID } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { and, asc, desc, eq, inArray, isNotNull, or } from 'drizzle-orm'
import { createError } from 'h3'
import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'
import { classifyImportRows } from '~~/shared/import/classify-import-rows'
import type { ExistingCertificateMatch } from '~~/shared/import/existing-certificate-match'
import { normalizeDocument } from '~~/shared/import/normalize-document'
import type {
  ImportBatchDto,
  ImportIncomingDataDto,
  ImportRowDto,
  StoredCertificateSnapshotDto
} from '~~/shared/schemas/import-api'
import type {
  ChangedFieldName,
  ClassifiedImportRow,
  ImportIssueCode,
  RawImportCsvRow
} from '~~/shared/schemas/import'
import { parseImportCsvRow } from '~~/shared/schemas/import'
import { useDb } from '../database/client'
import {
  adminUsers,
  auditConflicts,
  certificates,
  courses,
  importBatches,
  importRows
} from '../database/schema'
import type {
  IncomingImportDataWithoutDocument,
  RawImportRowWithoutDocument,
  StoredCertificateSnapshotWithoutDocument
} from '../database/schema/import-json-types'
import {
  computeDocumentLookupHmac,
  decryptDocument,
  encryptDocument
} from '../security/document-crypto'
import { isUniqueViolation } from '../utils/is-unique-violation'

const CSV_HEADERS = [
  'certificate_issue_id',
  'certificate_code',
  'certificate_id',
  'course_id',
  'course_name',
  'user_id',
  'participant_name',
  'document_number',
  'issued_at_unix'
] as const

const INSERT_CHUNK_SIZE = 500
const LOOKUP_CHUNK_SIZE = 500

export type ImportUploadFile = {
  fileName: string
  data: Buffer
}

type CertificateRow = typeof certificates.$inferSelect
type ImportBatchRow = typeof importBatches.$inferSelect
type ImportRow = typeof importRows.$inferSelect

type ParsedCsvRow = {
  rowNumber: number
  raw: RawImportCsvRow
}

type StagedRow = {
  classified: ClassifiedImportRow
  values: typeof importRows.$inferInsert
}

function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: 'Bad Request', message })
}

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false
  let quoteClosed = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
          quoteClosed = true
        }
      } else {
        field += char
      }
      continue
    }

    if (quoteClosed && char !== ',' && char !== '\r' && char !== '\n') {
      badRequest('CSV invÃ¡lido: caracteres despuÃ©s de una celda entre comillas')
    }
    if (char === '"') {
      if (field !== '' || quoteClosed) badRequest('CSV invÃ¡lido: comillas inesperadas')
      quoted = true
      continue
    }
    if (char === ',') {
      record.push(field)
      field = ''
      quoteClosed = false
      continue
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      record.push(field)
      records.push(record)
      record = []
      field = ''
      quoteClosed = false
      continue
    }
    field += char
  }

  if (quoted) badRequest('CSV invÃ¡lido: celda entre comillas sin cerrar')
  if (field !== '' || record.length > 0 || quoteClosed) {
    record.push(field)
    records.push(record)
  }
  return records
}

/** Strict Moodle CSV parser: UTF-8, exact header order and exactly nine cells per record. */
export function parseImportCsv(data: Buffer): ParsedCsvRow[] {
  if (data.length === 0) badRequest('El archivo CSV estÃ¡ vacÃ­o')

  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(data)
  } catch {
    badRequest('El archivo CSV debe estar codificado en UTF-8')
  }

  const records = parseCsvRecords(text!)
  if (records.length === 0) badRequest('El archivo CSV estÃ¡ vacÃ­o')
  const header = records[0]!
  if (header[0]?.startsWith('\uFEFF')) header[0] = header[0].slice(1)
  if (header.length !== CSV_HEADERS.length || CSV_HEADERS.some((name, i) => header[i] !== name)) {
    badRequest('El CSV debe contener exactamente las nueve columnas Moodle esperadas')
  }
  if (records.length === 1) badRequest('El archivo CSV no contiene filas de datos')

  return records.slice(1).map((cells, index) => {
    if (cells.length !== CSV_HEADERS.length) {
      badRequest(`La fila CSV ${index + 2} no contiene exactamente nueve columnas`)
    }
    return {
      rowNumber: index + 2,
      raw: Object.fromEntries(CSV_HEADERS.map((name, i) => [name, cells[i]!])) as RawImportCsvRow
    }
  })
}

export function withoutDocument(incoming: ClassifiedImportRow['incoming']): IncomingImportDataWithoutDocument | null {
  if (!incoming) return null
  const { documentNumber: _documentNumber, documentNumberNormalized: _normalized, ...safe } = incoming
  return safe
}

export function rawWithoutDocument(raw: RawImportCsvRow): RawImportRowWithoutDocument {
  const { document_number: _documentNumber, ...safe } = raw
  return safe
}

function certificateSnapshot(row: CertificateRow): StoredCertificateSnapshotWithoutDocument {
  return {
    certificateCode: row.certificateCode,
    certificateCodeNormalized: row.certificateCodeNormalized,
    participantName: row.participantName,
    courseName: row.courseName,
    issuedAt: row.issuedAt.toISOString(),
    certificateIssueId: row.certificateIssueId,
    certificateId: row.certificateId,
    courseId: row.moodleCourseId,
    userId: row.moodleUserId
  }
}

function comparableCertificate(
  row: CertificateRow,
  incomingDocumentHmac: string,
  incomingDocumentNormalized: string
): ComparableCertificate {
  return {
    certificateCode: row.certificateCode,
    certificateCodeNormalized: row.certificateCodeNormalized,
    snapshot: {
      participantName: row.participantName,
      documentNumber: '',
      // The 3A comparison only needs equality. HMAC equality provides it without decrypting stored PII.
      documentNumberNormalized:
        row.documentLookupHmac === incomingDocumentHmac ? incomingDocumentNormalized : '__different__',
      courseName: row.courseName,
      issuedAt: row.issuedAt.toISOString(),
      moodle: {
        certificateIssueId: row.certificateIssueId,
        certificateId: row.certificateId,
        courseId: row.moodleCourseId,
        userId: row.moodleUserId
      }
    }
  }
}

function resolveMatch(
  incoming: NonNullable<ClassifiedImportRow['incoming']>,
  byCode: Map<string, CertificateRow>,
  byIssueId: Map<number, CertificateRow>
): ExistingCertificateMatch {
  const codeMatch = byCode.get(incoming.certificateCodeNormalized)
  const issueMatch = byIssueId.get(incoming.certificateIssueId)
  const hmac = computeDocumentLookupHmac(incoming.documentNumberNormalized)

  if (codeMatch && issueMatch && codeMatch.id !== issueMatch.id) {
    return {
      kind: 'identity_collision',
      byCode: comparableCertificate(codeMatch, hmac, incoming.documentNumberNormalized),
      byIssueId: comparableCertificate(issueMatch, hmac, incoming.documentNumberNormalized)
    }
  }
  const match = codeMatch ?? issueMatch
  return match
    ? { kind: 'same_certificate', certificate: comparableCertificate(match, hmac, incoming.documentNumberNormalized) }
    : { kind: 'none' }
}

async function findRelevantCertificates(rows: ParsedCsvRow[]): Promise<CertificateRow[]> {
  const database = useDb()
  const parsed = rows
    .map(row => parseImportCsvRow(row.raw))
    .filter((result): result is Extract<typeof result, { ok: true }> => result.ok)
    .map(result => result.data)
  const found = new Map<string, CertificateRow>()

  for (let offset = 0; offset < parsed.length; offset += LOOKUP_CHUNK_SIZE) {
    const chunk = parsed.slice(offset, offset + LOOKUP_CHUNK_SIZE)
    const codes = [...new Set(chunk.map(row => row.certificateCodeNormalized))]
    const issueIds = [...new Set(chunk.map(row => row.certificateIssueId))]
    const matches = await database
      .select()
      .from(certificates)
      .where(or(
        inArray(certificates.certificateCodeNormalized, codes),
        inArray(certificates.certificateIssueId, issueIds)
      ))
    for (const match of matches) found.set(match.id, match)
  }
  return [...found.values()]
}

function buildCounters(rows: ClassifiedImportRow[]) {
  return {
    total: rows.length,
    newCount: rows.filter(row => row.status === 'new').length,
    unchangedCount: rows.filter(row => row.status === 'unchanged').length,
    conflictCount: rows.filter(row => row.status === 'conflict').length,
    criticalConflictCount: rows.filter(row => row.status === 'critical_conflict').length,
    errorCount: rows.filter(row => row.status === 'error').length,
    processedRows: rows.length
  }
}

export function terminalImportBatchStatus(counters: Pick<
  ImportBatchRow,
  'conflictCount' | 'criticalConflictCount' | 'errorCount'
>): 'completed' | 'completed_with_conflicts' {
  return counters.conflictCount > 0
    || counters.criticalConflictCount > 0
    || counters.errorCount > 0
    ? 'completed_with_conflicts'
    : 'completed'
}

async function markBatchFailed(batchId: string) {
  const database = useDb()
  await database
    .update(importBatches)
    .set({ status: 'failed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(importBatches.id, batchId))
}

function maskDocument(value: string): string {
  const normalized = normalizeDocument(value)
  if (!normalized) return '********'
  if (normalized.length <= 2) return '*'.repeat(normalized.length)
  return `${'*'.repeat(Math.max(normalized.length - 2, 4))}${normalized.slice(-2)}`
}

function batchToDto(
  batch: ImportBatchRow,
  courseName: string,
  importedBy: string,
  rows: ImportRowDto[] = []
): ImportBatchDto {
  return {
    id: batch.id,
    originalFileName: batch.originalFileName,
    fileHash: batch.fileHash,
    courseLocalId: batch.courseId,
    courseName,
    importedBy,
    importedAt: batch.createdAt.toISOString(),
    startedAt: batch.startedAt?.toISOString() ?? null,
    completedAt: batch.completedAt?.toISOString() ?? null,
    counters: {
      total: batch.total,
      new: batch.newCount,
      unchanged: batch.unchangedCount,
      conflict: batch.conflictCount,
      criticalConflict: batch.criticalConflictCount,
      errors: batch.errorCount
    },
    status: batch.status,
    rows
  }
}

async function rowToDto(row: ImportRow, batch: ImportBatchRow): Promise<ImportRowDto | null> {
  if (!row.status) return null
  const plaintext = decryptDocument(
    {
      ciphertext: row.documentCiphertext,
      nonce: row.documentNonce,
      authTag: row.documentAuthTag,
      keyVersion: row.documentKeyVersion
    },
    { purpose: 'import-row-document', recordId: row.id }
  )
  const incoming = row.incomingData as ImportIncomingDataDto | null
  return {
    id: row.id,
    importId: batch.id,
    rowNumber: row.rowNumber,
    originalFileName: batch.originalFileName,
    fileHash: batch.fileHash,
    certificateCode: incoming?.certificateCode ?? row.rawWithoutDocument.certificate_code,
    participantName: incoming?.participantName ?? row.rawWithoutDocument.participant_name,
    documentMasked: maskDocument(plaintext),
    status: row.status,
    reason: row.reason,
    storedSnapshot: row.storedSnapshotData as StoredCertificateSnapshotDto | null,
    incomingData: incoming,
    changedFields: row.changedFields as ChangedFieldName[],
    issueCodes: row.issueCodes as ImportIssueCode[]
  }
}

export async function createImportBatch(
  file: ImportUploadFile,
  courseId: string,
  adminId: string
): Promise<ImportBatchDto> {
  if (!file.fileName.trim()) badRequest('El archivo debe tener nombre')
  if (file.data.length === 0) badRequest('El archivo CSV estÃ¡ vacÃ­o')

  const database = useDb()
  const [course] = await database.select().from(courses).where(eq(courses.id, courseId)).limit(1)
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Curso no encontrado' })
  }

  const fileHash = createHash('sha256').update(file.data).digest('hex')
  const [existing] = await database
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(and(
      eq(importBatches.courseId, courseId),
      eq(importBatches.fileHash, fileHash),
      inArray(importBatches.status, ['pending', 'processing', 'paused'])
    ))
    .limit(1)
  if (existing) return (await getImportBatch(existing.id))!

  const [previousAttempt] = await database
    .select()
    .from(importBatches)
    .where(and(
      eq(importBatches.courseId, courseId),
      eq(importBatches.fileHash, fileHash)
    ))
    .orderBy(desc(importBatches.attemptNumber))
    .limit(1)
  const retryAt = previousAttempt ? new Date() : null

  let batch: ImportBatchRow | undefined
  try {
    [batch] = await database
      .insert(importBatches)
      .values({
        courseId,
        createdByAdminId: adminId,
        originalFileName: file.fileName.trim(),
        fileHash,
        attemptNumber: previousAttempt ? previousAttempt.attemptNumber + 1 : 1,
        retryOfBatchId: previousAttempt?.id ?? null,
        retryAuthorizedByAdminId: previousAttempt ? adminId : null,
        retryAuthorizedAt: retryAt,
        retryReason: previousAttempt ? 'Reintento solicitado mediante nueva carga administrativa' : null
      })
      .returning()
  } catch (error: unknown) {
    if (!isUniqueViolation(error)) throw error
    const [active] = await database
      .select({ id: importBatches.id })
      .from(importBatches)
      .where(and(
        eq(importBatches.courseId, courseId),
        eq(importBatches.fileHash, fileHash),
        inArray(importBatches.status, ['pending', 'processing', 'paused'])
      ))
      .limit(1)
    if (active) return (await getImportBatch(active.id))!
    throw error
  }
  if (!batch) throw createError({ statusCode: 500, message: 'No se pudo crear el lote' })

  try {
    const parsedRows = parseImportCsv(file.data)
    await database
      .update(importBatches)
      .set({
        status: 'processing',
        total: parsedRows.length,
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(importBatches.id, batch.id))

    const relevantCertificates = await findRelevantCertificates(parsedRows)
    const byCode = new Map(relevantCertificates.map(row => [row.certificateCodeNormalized, row]))
    const byIssueId = new Map(relevantCertificates.map(row => [row.certificateIssueId, row]))
    const matches = new Map<number, ExistingCertificateMatch>()
    for (const row of parsedRows) {
      const parsed = parseImportCsvRow(row.raw)
      matches.set(row.rowNumber, parsed.ok ? resolveMatch(parsed.data, byCode, byIssueId) : { kind: 'none' })
    }

    const classified = classifyImportRows(
      parsedRows.map(row => ({
        rowNumber: row.rowNumber,
        raw: row.raw,
        match: matches.get(row.rowNumber) ?? { kind: 'none' }
      })),
      course.moodleCourseId
    )
    const certificatesByNormalizedCode = byCode
    const staged: StagedRow[] = classified.map((row) => {
      const id = randomUUID()
      const encrypted = encryptDocument(row.raw.document_number, {
        purpose: 'import-row-document',
        recordId: id
      })
      const normalizedDocument = normalizeDocument(row.raw.document_number)
      const documentLookupHmac = normalizedDocument
        ? computeDocumentLookupHmac(normalizedDocument)
        : null
      // Persist only the match accepted by 3A. Structural, duplicate and course errors clear it.
      const match = row.match ?? { kind: 'none' }
      let matchedCertificateId: string | null = null
      let collisionByCodeCertificateId: string | null = null
      let collisionByIssueIdCertificateId: string | null = null
      let storedSnapshotData: StoredCertificateSnapshotWithoutDocument | null = null
      let storedDocumentLookupHmac: string | null = null

      if (match.kind === 'same_certificate') {
        const stored = certificatesByNormalizedCode.get(match.certificate.certificateCodeNormalized)
          ?? relevantCertificates.find(cert => cert.certificateIssueId === match.certificate.snapshot.moodle.certificateIssueId)
        if (stored) {
          matchedCertificateId = stored.id
          storedSnapshotData = certificateSnapshot(stored)
          storedDocumentLookupHmac = stored.documentLookupHmac
        }
      } else if (match.kind === 'identity_collision') {
        collisionByCodeCertificateId = byCode.get(row.incoming!.certificateCodeNormalized)?.id ?? null
        collisionByIssueIdCertificateId = byIssueId.get(row.incoming!.certificateIssueId)?.id ?? null
      }

      return {
        classified: row,
        values: {
          id,
          batchId: batch.id,
          rowNumber: row.rowNumber,
          status: row.status,
          reason: row.reason,
          rawWithoutDocument: rawWithoutDocument(row.raw),
          documentCiphertext: encrypted.ciphertext,
          documentNonce: encrypted.nonce,
          documentAuthTag: encrypted.authTag,
          documentKeyVersion: encrypted.keyVersion,
          documentLookupHmac,
          incomingData: withoutDocument(row.incoming),
          certificateCodeNormalized: row.incoming?.certificateCodeNormalized ?? null,
          certificateIssueId: row.incoming?.certificateIssueId ?? null,
          storedSnapshotData,
          storedDocumentLookupHmac,
          matchedCertificateId,
          collisionByCodeCertificateId,
          collisionByIssueIdCertificateId,
          changedFields: row.changedFields as ChangedFieldName[],
          issueCodes: row.issueCodes,
          processedAt: new Date()
        }
      }
    })
    const counters = buildCounters(classified)

    await database.transaction(async (tx) => {
      for (let offset = 0; offset < staged.length; offset += INSERT_CHUNK_SIZE) {
        await tx.insert(importRows).values(staged.slice(offset, offset + INSERT_CHUNK_SIZE).map(row => row.values))
      }
      await tx
        .update(importBatches)
        .set({ status: 'paused', ...counters, updatedAt: new Date() })
        .where(and(eq(importBatches.id, batch.id), eq(importBatches.status, 'processing')))
    })
  } catch (error: unknown) {
    await markBatchFailed(batch.id)
    throw error
  }

  return (await getImportBatch(batch.id))!
}

export async function listImportBatches(): Promise<ImportBatchDto[]> {
  const database = useDb()
  const rows = await database
    .select({ batch: importBatches, courseName: courses.name, importedBy: adminUsers.username })
    .from(importBatches)
    .innerJoin(courses, eq(importBatches.courseId, courses.id))
    .innerJoin(adminUsers, eq(importBatches.createdByAdminId, adminUsers.id))
    .orderBy(desc(importBatches.createdAt))
  return rows.map(row => batchToDto(row.batch, row.courseName, row.importedBy))
}

export async function getImportBatch(id: string): Promise<ImportBatchDto | null> {
  const database = useDb()
  const [joined] = await database
    .select({ batch: importBatches, courseName: courses.name, importedBy: adminUsers.username })
    .from(importBatches)
    .innerJoin(courses, eq(importBatches.courseId, courses.id))
    .innerJoin(adminUsers, eq(importBatches.createdByAdminId, adminUsers.id))
    .where(eq(importBatches.id, id))
    .limit(1)
  if (!joined) return null

  const storedRows = await database
    .select()
    .from(importRows)
    .where(and(eq(importRows.batchId, id), isNotNull(importRows.status)))
    .orderBy(asc(importRows.rowNumber))
  const dtoRows = (await Promise.all(storedRows.map(row => rowToDto(row, joined.batch))))
    .filter((row): row is ImportRowDto => row !== null)
  return batchToDto(joined.batch, joined.courseName, joined.importedBy, dtoRows)
}

export async function confirmImportBatch(batchId: string, adminId: string): Promise<ImportBatchDto> {
  const database = useDb()
  await database.transaction(async (tx) => {
    const now = new Date()
    const [batch] = await tx
      .update(importBatches)
      .set({ status: 'processing', updatedAt: now })
      .where(and(eq(importBatches.id, batchId), eq(importBatches.status, 'paused')))
      .returning()
    if (!batch) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'El lote no estÃ¡ pausado' })
    }

    const rows = await tx.select().from(importRows).where(eq(importRows.batchId, batchId))
    const collisionIds = [...new Set(rows.flatMap(row => [
      row.collisionByCodeCertificateId,
      row.collisionByIssueIdCertificateId
    ]).filter((id): id is string => Boolean(id)))]
    const collisionCertificates = collisionIds.length
      ? await tx.select().from(certificates).where(inArray(certificates.id, collisionIds))
      : []
    const collisionById = new Map(collisionCertificates.map(row => [row.id, row]))

    const newCertificates: (typeof certificates.$inferInsert)[] = []
    const audits: (typeof auditConflicts.$inferInsert)[] = []
    for (const row of rows) {
      const incoming = row.incomingData
      if (row.status === 'new' && incoming && row.documentLookupHmac) {
        const document = decryptDocument({
          ciphertext: row.documentCiphertext,
          nonce: row.documentNonce,
          authTag: row.documentAuthTag,
          keyVersion: row.documentKeyVersion
        }, { purpose: 'import-row-document', recordId: row.id })
        const certificateId = randomUUID()
        const encrypted = encryptDocument(document, {
          purpose: 'certificate-document',
          recordId: certificateId
        })
        newCertificates.push({
          id: certificateId,
          sourceImportRowId: row.id,
          courseId: batch.courseId,
          certificateCode: incoming.certificateCode,
          certificateCodeNormalized: incoming.certificateCodeNormalized,
          certificateIssueId: incoming.certificateIssueId,
          certificateId: incoming.certificateId,
          moodleCourseId: incoming.courseId,
          moodleUserId: incoming.userId,
          courseName: incoming.courseName,
          participantName: incoming.participantName,
          documentCiphertext: encrypted.ciphertext,
          documentNonce: encrypted.nonce,
          documentAuthTag: encrypted.authTag,
          documentLookupHmac: row.documentLookupHmac,
          documentKeyVersion: encrypted.keyVersion,
          issuedAt: new Date(incoming.issuedAt),
          importedAt: now
        })
      }

      if ((row.status === 'conflict' || row.status === 'critical_conflict') && incoming && row.documentLookupHmac) {
        const byCode = row.collisionByCodeCertificateId
          ? collisionById.get(row.collisionByCodeCertificateId)
          : undefined
        const byIssue = row.collisionByIssueIdCertificateId
          ? collisionById.get(row.collisionByIssueIdCertificateId)
          : undefined
        audits.push({
          importBatchId: batch.id,
          importRowId: row.id,
          courseId: batch.courseId,
          certificateId: row.matchedCertificateId,
          collisionByCodeCertificateId: row.collisionByCodeCertificateId,
          collisionByIssueIdCertificateId: row.collisionByIssueIdCertificateId,
          originalFileName: batch.originalFileName,
          fileHash: batch.fileHash,
          csvRowNumber: row.rowNumber,
          importedByAdminId: adminId,
          detectedAt: now,
          storedSnapshotData: row.storedSnapshotData,
          storedDocumentLookupHmac: row.storedDocumentLookupHmac,
          collisionByCodeSnapshotData: byCode ? certificateSnapshot(byCode) : null,
          collisionByCodeDocumentLookupHmac: byCode?.documentLookupHmac ?? null,
          collisionByIssueIdSnapshotData: byIssue ? certificateSnapshot(byIssue) : null,
          collisionByIssueIdDocumentLookupHmac: byIssue?.documentLookupHmac ?? null,
          incomingData: incoming,
          incomingDocumentLookupHmac: row.documentLookupHmac,
          changedFields: row.changedFields,
          issueCodes: row.issueCodes,
          riskLevel: row.status === 'critical_conflict' ? 'critical' : 'medium'
        })
      }
    }

    for (let offset = 0; offset < newCertificates.length; offset += INSERT_CHUNK_SIZE) {
      await tx.insert(certificates).values(newCertificates.slice(offset, offset + INSERT_CHUNK_SIZE))
    }
    for (let offset = 0; offset < audits.length; offset += INSERT_CHUNK_SIZE) {
      await tx.insert(auditConflicts).values(audits.slice(offset, offset + INSERT_CHUNK_SIZE))
    }
    await tx
      .update(courses)
      .set({ lastImportAt: now, updatedAt: now })
      .where(eq(courses.id, batch.courseId))
    const terminalStatus = terminalImportBatchStatus(batch)
    await tx
      .update(importBatches)
      .set({ status: terminalStatus, completedAt: now, updatedAt: now })
      .where(eq(importBatches.id, batch.id))
  })

  const result = await getImportBatch(batchId)
  if (!result) throw createError({ statusCode: 404, message: 'Lote no encontrado' })
  return result
}

export async function discardImportBatch(batchId: string): Promise<ImportBatchDto> {
  const database = useDb()
  const [discarded] = await database
    .update(importBatches)
    .set({ status: 'failed', completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(importBatches.id, batchId), eq(importBatches.status, 'paused')))
    .returning({ id: importBatches.id })
  if (!discarded) {
    const [existing] = await database
      .select({ id: importBatches.id })
      .from(importBatches)
      .where(eq(importBatches.id, batchId))
      .limit(1)
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Lote no encontrado' })
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'El lote no estÃ¡ pausado' })
  }
  return (await getImportBatch(batchId))!
}
