import { coursesRepository } from '../repositories/courses.repository'
import { useMockStore } from './useMockStore'

export function useCourses() {
  const store = useMockStore()

  const courses = computed(() => store.value.courses)

  return {
    courses,
    list: coursesRepository.list,
    getById: coursesRepository.getById,
    create: coursesRepository.create,
    update: coursesRepository.update,
    setPublished: coursesRepository.setPublished
  }
}
