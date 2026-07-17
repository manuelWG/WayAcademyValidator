import { courseIdParamSchema } from '../../../../shared/schemas/course'
import { getCourseById } from '../../../services/courses.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)

  let id: string
  try {
    id = courseIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid course id' })
  }

  const course = await getCourseById(id)
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Curso no encontrado' })
  }
  return course
})
