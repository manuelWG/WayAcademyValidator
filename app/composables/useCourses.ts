import type { Course } from '../types/course'
import { coursesRepository } from '../repositories/courses.repository'

export function useCourses() {
  const courses = useState<Course[]>('admin-courses-list', () => [])

  async function list() {
    const data = await coursesRepository.list()
    courses.value = data
    return data
  }

  async function getById(id: string) {
    return coursesRepository.getById(id)
  }

  async function create(input: { moodleCourseId: number, name: string, notes?: string }) {
    const course = await coursesRepository.create(input)
    courses.value = [...courses.value, course]
    return course
  }

  async function update(id: string, input: { name: string, notes?: string }) {
    const course = await coursesRepository.update(id, input)
    if (course) {
      courses.value = courses.value.map(c => (c.id === id ? course : c))
    }
    return course
  }

  async function setPublished(id: string, isPublished: boolean) {
    const course = await coursesRepository.setPublished(id, isPublished)
    if (course) {
      courses.value = courses.value.map(c => (c.id === id ? course : c))
    }
    return course
  }

  const publishedCount = computed(() => courses.value.filter(c => c.isPublished).length)

  return {
    courses,
    publishedCount,
    list,
    getById,
    create,
    update,
    setPublished
  }
}
