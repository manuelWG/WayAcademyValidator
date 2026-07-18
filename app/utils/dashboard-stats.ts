import type { DashboardStats } from '../types/admin'
import type { AuditConflict } from '../types/audit'
import type { ImportBatch } from '../types/import'
import type { MockStoreState } from '../types/store'

export function computeDashboardStats(
  state: MockStoreState,
  imports: ImportBatch[],
  auditConflicts: AuditConflict[]
): DashboardStats {
  const publishedCourses = state.courses.filter(c => c.isPublished).length
  const importedCertificates = state.certificates.length
  const participants = new Set(
    state.certificates.map(c => c.snapshot.documentNumberNormalized)
  )
  const lastImportAt = imports
    .map(i => i.importedAt)
    .sort()
    .at(-1) ?? null
  const pendingConflicts = auditConflicts.filter(a => a.status === 'pending').length

  return {
    publishedCourses,
    importedCertificates,
    participantsWithCertificates: participants.size,
    lastImportAt,
    pendingConflicts
  }
}
