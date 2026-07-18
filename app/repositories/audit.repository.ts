import type { AuditConflict } from '../types/audit'

export const auditRepository = {
  async list(): Promise<AuditConflict[]> {
    return await $fetch<AuditConflict[]>('/api/admin/audit')
  },

  async getById(id: string): Promise<AuditConflict | null> {
    try {
      return await $fetch<AuditConflict>(`/api/admin/audit/${id}`)
    } catch (error: unknown) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async decide(
    id: string,
    decision: 'accepted' | 'rejected',
    observation: string
  ): Promise<AuditConflict> {
    return await $fetch<AuditConflict>(`/api/admin/audit/${id}/decide`, {
      method: 'POST',
      body: { decision, observation }
    })
  }
}

function isNotFound(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'statusCode' in error
    && (error as { statusCode: number }).statusCode === 404
  )
}
