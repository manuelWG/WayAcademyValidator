import type { ImportBatch } from '../types/import'

export const importsRepository = {
  async list(): Promise<ImportBatch[]> {
    return await $fetch<ImportBatch[]>('/api/admin/imports')
  },

  async getById(id: string): Promise<ImportBatch | null> {
    try {
      return await $fetch<ImportBatch>(`/api/admin/imports/${id}`)
    } catch (error: unknown) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async upload(courseId: string, file: File): Promise<ImportBatch> {
    const body = new FormData()
    body.append('courseId', courseId)
    body.append('file', file)

    return await $fetch<ImportBatch>('/api/admin/imports', {
      method: 'POST',
      body
    })
  },

  async confirm(id: string): Promise<ImportBatch> {
    return await $fetch<ImportBatch>(`/api/admin/imports/${id}/confirm`, {
      method: 'POST'
    })
  },

  async discard(id: string): Promise<ImportBatch> {
    return await $fetch<ImportBatch>(`/api/admin/imports/${id}/discard`, {
      method: 'POST'
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
