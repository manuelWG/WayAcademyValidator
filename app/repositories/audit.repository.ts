import type { AuditConflict } from '../types/audit'
import { delay } from '../utils/delay'
import { useMockStore } from '../composables/useMockStore'

function getStore() {
  return useMockStore()
}

export const auditRepository = {
  async list(): Promise<AuditConflict[]> {
    await delay(300)
    return [...getStore().value.auditConflicts].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    )
  },

  async getById(id: string): Promise<AuditConflict | null> {
    await delay(200)
    return getStore().value.auditConflicts.find(a => a.id === id) ?? null
  },

  async decide(
    id: string,
    decision: 'accepted' | 'rejected',
    reviewedBy: string,
    observation: string
  ): Promise<AuditConflict | null> {
    await delay(500)
    const store = getStore()
    const conflict = store.value.auditConflicts.find(a => a.id === id)
    if (!conflict) return null

    // Prototype: never mutate the published certificate snapshot.
    conflict.status = decision
    conflict.reviewedAt = new Date().toISOString()
    conflict.reviewedBy = reviewedBy
    conflict.observation = observation.trim() || (
      decision === 'accepted'
        ? 'Aceptado. La aplicación del cambio al snapshot se realizará en una fase futura.'
        : 'Rechazado. Se conserva el snapshot publicado.'
    )

    return { ...conflict }
  },

  listPending(): AuditConflict[] {
    return getStore().value.auditConflicts.filter(a => a.status === 'pending')
  }
}
