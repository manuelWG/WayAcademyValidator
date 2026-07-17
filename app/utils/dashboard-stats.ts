import type { DashboardStats } from '../types/admin'
import type { MockStoreState } from '../types/store'

export function computeDashboardStats(state: MockStoreState): DashboardStats {
  const publishedCourses = state.courses.filter(c => c.isPublished).length
  const importedCertificates = state.certificates.length
  const participants = new Set(
    state.certificates.map(c => c.snapshot.documentNumberNormalized)
  )
  const lastImportAt = state.imports
    .map(i => i.importedAt)
    .sort()
    .at(-1) ?? null
  const pendingConflicts = state.auditConflicts.filter(a => a.status === 'pending').length

  return {
    publishedCourses,
    importedCertificates,
    participantsWithCertificates: participants.size,
    lastImportAt,
    pendingConflicts
  }
}
