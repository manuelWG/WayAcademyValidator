import type { ImportBatch, ImportPreviewRow, ImportIncomingData } from '../types/import'
import type { AuditConflict } from '../types/audit'
import type { CertificateSnapshot } from '../types/certificate'
import { delay } from '../utils/delay'
import { maskDocument } from '../utils/mask-document'
import { normalizeCertificateCode } from '../utils/normalize-certificate-code'
import { normalizeDocument } from '../utils/normalize-document'
import { useMockStore } from '../composables/useMockStore'

// MOCK — fase posterior: importación CSV real

function getStore() {
  return useMockStore()
}

function simulateFileMeta(fileName: string) {
  const hash = Array.from(fileName)
    .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0)
    .toString(16)
    .replace('-', 'a')
    .padStart(32, '0')
    .slice(0, 32)
  return {
    originalFileName: fileName || 'certificados_demo.csv',
    fileHash: hash
  }
}

export const importsRepository = {
  async list(): Promise<ImportBatch[]> {
    await delay(300)
    return [...getStore().value.imports].sort(
      (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    )
  },

  async getById(id: string): Promise<ImportBatch | null> {
    await delay(200)
    return getStore().value.imports.find(i => i.id === id) ?? null
  },

  async validateStructure(_fileName: string): Promise<{ ok: boolean, message: string }> {
    await delay(500)
    return {
      ok: true,
      message: 'Estructura CSV válida (simulado). Columnas esperadas presentes.'
    }
  },

  async simulatePreview(courseLocalId: string, fileName: string): Promise<ImportPreviewRow[]> {
    await delay(800)
    const store = getStore()
    const course = store.value.courses.find(c => c.id === courseLocalId)
    if (!course) return []

    const meta = simulateFileMeta(fileName)
    const existing = store.value.certificates.filter(c => c.courseLocalId === courseLocalId)

    const rows: ImportPreviewRow[] = []

    // Row belonging to another course → error
    rows.push({
      importId: null,
      rowNumber: 2,
      ...meta,
      certificateCode: 'WAY-OTHER-9999',
      participantName: 'Participante de otro curso',
      documentMasked: maskDocument('99.888.777'),
      status: 'error',
      reason: `La fila pertenece a otro curso (course_id=999 ≠ moodleCourseId=${course.moodleCourseId})`,
      storedSnapshot: null,
      incomingData: {
        participantName: 'Participante de otro curso',
        documentNumber: '99.888.777',
        documentNumberNormalized: normalizeDocument('99.888.777'),
        courseName: 'Curso ajeno',
        courseId: 999,
        certificateCode: 'WAY-OTHER-9999',
        certificateCodeNormalized: 'WAY-OTHER-9999',
        issuedAt: '2026-01-01T00:00:00.000Z',
        certificateIssueId: 1,
        certificateId: 1,
        userId: 1
      },
      changedFields: []
    })

    // New certificate
    rows.push({
      importId: null,
      rowNumber: 3,
      ...meta,
      certificateCode: `WAY-NEW-${course.moodleCourseId}-0001`,
      participantName: 'Nuevo Participante Demo',
      documentMasked: maskDocument('12.345.678'),
      status: 'new',
      reason: 'Certificado nuevo',
      storedSnapshot: null,
      incomingData: {
        participantName: 'Nuevo Participante Demo',
        documentNumber: '12.345.678',
        documentNumberNormalized: normalizeDocument('12.345.678'),
        courseName: course.name,
        courseId: course.moodleCourseId,
        certificateCode: `WAY-NEW-${course.moodleCourseId}-0001`,
        certificateCodeNormalized: `WAY-NEW-${course.moodleCourseId}-0001`,
        issuedAt: '2026-07-01T10:00:00.000Z',
        certificateIssueId: 9500 + course.moodleCourseId,
        certificateId: 500 + course.moodleCourseId,
        userId: 2001
      },
      changedFields: []
    })

    if (existing[0]) {
      const c = existing[0]
      rows.push({
        importId: null,
        rowNumber: 4,
        ...meta,
        certificateCode: c.certificateCode,
        participantName: c.snapshot.participantName,
        documentMasked: maskDocument(c.snapshot.documentNumber),
        status: 'unchanged',
        reason: 'Sin diferencias respecto al snapshot publicado',
        storedSnapshot: c.snapshot,
        incomingData: snapshotToIncoming(c.snapshot, c.certificateCode),
        changedFields: []
      })
    }

    if (existing[1]) {
      const c = existing[1]
      const incomingName = `${c.snapshot.participantName} (act.)`
      rows.push({
        importId: null,
        rowNumber: 5,
        ...meta,
        certificateCode: c.certificateCode,
        participantName: incomingName,
        documentMasked: maskDocument(c.snapshot.documentNumber),
        status: 'critical_conflict',
        reason: 'Cambio crítico de identidad: nombre del participante',
        storedSnapshot: c.snapshot,
        incomingData: {
          ...snapshotToIncoming(c.snapshot, c.certificateCode),
          participantName: incomingName
        },
        changedFields: ['participantName']
      })
    }

    if (existing[2]) {
      const c = existing[2]
      const newDoc = '00.111.222'
      rows.push({
        importId: null,
        rowNumber: 6,
        ...meta,
        certificateCode: c.certificateCode,
        participantName: c.snapshot.participantName,
        documentMasked: maskDocument(newDoc),
        status: 'critical_conflict',
        reason: 'Cambio crítico de identidad: cédula',
        storedSnapshot: c.snapshot,
        incomingData: {
          ...snapshotToIncoming(c.snapshot, c.certificateCode),
          documentNumber: newDoc,
          documentNumberNormalized: normalizeDocument(newDoc)
        },
        changedFields: ['documentNumberNormalized']
      })
    }

    // Malformed row
    rows.push({
      importId: null,
      rowNumber: 7,
      ...meta,
      certificateCode: '',
      participantName: '',
      documentMasked: '********',
      status: 'error',
      reason: 'Fila incompleta: faltan código y participante',
      storedSnapshot: null,
      incomingData: null,
      changedFields: []
    })

    return rows
  },

  async confirmImport(input: {
    courseLocalId: string
    fileName: string
    importedBy: string
    rows: ImportPreviewRow[]
  }): Promise<ImportBatch> {
    await delay(900)
    const store = getStore()
    const course = store.value.courses.find(c => c.id === input.courseLocalId)
    if (!course) throw new Error('Curso no encontrado')

    const meta = simulateFileMeta(input.fileName)
    const importId = `imp-${Date.now()}`
    const importedAt = new Date().toISOString()

    const counters = {
      total: input.rows.length,
      new: input.rows.filter(r => r.status === 'new').length,
      unchanged: input.rows.filter(r => r.status === 'unchanged').length,
      conflict: input.rows.filter(r => r.status === 'conflict').length,
      criticalConflict: input.rows.filter(r => r.status === 'critical_conflict').length,
      errors: input.rows.filter(r => r.status === 'error').length
    }

    const rows = input.rows.map(r => ({ ...r, importId, ...meta }))

    // Add new certificates only for "new" rows matching this course
    for (const row of rows) {
      if (row.status !== 'new' || !row.incomingData) continue
      if (row.incomingData.courseId !== course.moodleCourseId) continue

      store.value.certificates.push({
        id: `cert-${Date.now()}-${row.rowNumber}`,
        certificateCode: normalizeCertificateCode(row.incomingData.certificateCode),
        certificateCodeNormalized: normalizeCertificateCode(row.incomingData.certificateCode),
        snapshot: {
          participantName: row.incomingData.participantName,
          documentNumber: row.incomingData.documentNumber,
          documentNumberNormalized: row.incomingData.documentNumberNormalized,
          courseName: course.name,
          issuedAt: row.incomingData.issuedAt,
          moodle: {
            certificateIssueId: row.incomingData.certificateIssueId,
            certificateId: row.incomingData.certificateId,
            courseId: row.incomingData.courseId,
            userId: row.incomingData.userId
          }
        },
        courseLocalId: course.id,
        importedAt,
        publicVisible: course.isPublished
      })
    }

    // Create audit for conflict + critical_conflict — never mutate snapshots
    const newAudits: AuditConflict[] = []
    for (const row of rows) {
      if (row.status !== 'conflict' && row.status !== 'critical_conflict') continue
      if (!row.storedSnapshot || !row.incomingData) continue

      newAudits.push({
        id: `aud-${Date.now()}-${row.rowNumber}`,
        certificateCode: row.certificateCode,
        courseLocalId: course.id,
        courseName: course.name,
        importId,
        originalFileName: meta.originalFileName,
        fileHash: meta.fileHash,
        csvRowNumber: row.rowNumber,
        importedBy: input.importedBy,
        detectedAt: importedAt,
        storedSnapshot: row.storedSnapshot,
        incomingData: row.incomingData,
        changedFields: [...row.changedFields],
        riskLevel: row.status === 'critical_conflict' ? 'critical' : 'medium',
        status: 'pending',
        reviewedAt: null,
        reviewedBy: null,
        observation: null
      })
    }

    course.certificatesCount = store.value.certificates.filter(c => c.courseLocalId === course.id).length
    course.lastImportAt = importedAt

    const batch: ImportBatch = {
      id: importId,
      originalFileName: meta.originalFileName,
      fileHash: meta.fileHash,
      courseLocalId: course.id,
      courseName: course.name,
      importedBy: input.importedBy,
      importedAt,
      counters,
      status: (counters.criticalConflict + counters.conflict) > 0
        ? 'completed_with_conflicts'
        : counters.errors === counters.total
          ? 'failed'
          : 'completed',
      rows
    }

    store.value.imports = [batch, ...store.value.imports]
    store.value.auditConflicts = [...newAudits, ...store.value.auditConflicts]

    return batch
  }
}

function snapshotToIncoming(snapshot: CertificateSnapshot, code: string): ImportIncomingData {
  return {
    participantName: snapshot.participantName,
    documentNumber: snapshot.documentNumber,
    documentNumberNormalized: snapshot.documentNumberNormalized,
    courseName: snapshot.courseName,
    courseId: snapshot.moodle.courseId,
    certificateCode: code,
    certificateCodeNormalized: normalizeCertificateCode(code),
    issuedAt: snapshot.issuedAt,
    certificateIssueId: snapshot.moodle.certificateIssueId,
    certificateId: snapshot.moodle.certificateId,
    userId: snapshot.moodle.userId
  }
}
