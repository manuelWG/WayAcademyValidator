import type { Course } from '../types/course'

export const coursesRepository = {
  async list(): Promise<Course[]> {
    return await $fetch<Course[]>('/api/admin/courses')
  },

  async getById(id: string): Promise<Course | null> {
    try {
      return await $fetch<Course>(`/api/admin/courses/${id}`)
    } catch (error: unknown) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async create(input: { moodleCourseId: number, name: string, notes?: string }): Promise<Course> {
    return await $fetch<Course>('/api/admin/courses', {
      method: 'POST',
      body: input
    })
  },

  async update(id: string, input: { name: string, notes?: string }): Promise<Course | null> {
    try {
      return await $fetch<Course>(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        body: input
      })
    } catch (error: unknown) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async setPublished(id: string, isPublished: boolean): Promise<Course | null> {
    try {
      const path = isPublished
        ? `/api/admin/courses/${id}/publish`
        : `/api/admin/courses/${id}/unpublish`
      return await $fetch<Course>(path, { method: 'POST' })
    } catch (error: unknown) {
      if (isNotFound(error)) return null
      throw error
    }
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
