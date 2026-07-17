import type { Course } from '../types/course'
import { delay } from '../utils/delay'
import { useMockStore } from '../composables/useMockStore'

function getStore() {
  return useMockStore()
}

function syncCertificateVisibility(courseId: string, isPublished: boolean) {
  const store = getStore()
  store.value.certificates = store.value.certificates.map(c =>
    c.courseLocalId === courseId ? { ...c, publicVisible: isPublished } : c
  )
}

function refreshCertificateCount(courseId: string) {
  const store = getStore()
  const count = store.value.certificates.filter(c => c.courseLocalId === courseId).length
  const course = store.value.courses.find(c => c.id === courseId)
  if (course) course.certificatesCount = count
}

export const coursesRepository = {
  async list(): Promise<Course[]> {
    await delay(300)
    return getStore().value.courses
  },

  async getById(id: string): Promise<Course | null> {
    await delay(200)
    return getStore().value.courses.find(c => c.id === id) ?? null
  },

  async create(input: { moodleCourseId: number, name: string, notes?: string }): Promise<Course> {
    await delay(500)
    const store = getStore()
    const course: Course = {
      id: `course-${Date.now()}`,
      moodleCourseId: input.moodleCourseId,
      name: input.name.trim(),
      notes: input.notes?.trim() ?? '',
      isPublished: false,
      certificatesCount: 0,
      lastImportAt: null,
      createdAt: new Date().toISOString()
    }
    store.value.courses = [...store.value.courses, course]
    return course
  },

  async update(id: string, input: { name: string, notes?: string }): Promise<Course | null> {
    await delay(400)
    const store = getStore()
    const index = store.value.courses.findIndex(c => c.id === id)
    if (index < 0) return null
    const updated = {
      ...store.value.courses[index]!,
      name: input.name.trim(),
      notes: input.notes?.trim() ?? ''
    }
    store.value.courses = store.value.courses.map((c, i) => (i === index ? updated : c))
    return updated
  },

  async setPublished(id: string, isPublished: boolean): Promise<Course | null> {
    await delay(400)
    const store = getStore()
    const course = store.value.courses.find(c => c.id === id)
    if (!course) return null
    course.isPublished = isPublished
    syncCertificateVisibility(id, isPublished)
    refreshCertificateCount(id)
    return { ...course }
  }
}
