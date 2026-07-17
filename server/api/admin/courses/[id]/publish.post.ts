import { courseIdParamSchema } from '../../../../../shared/schemas/course'
import { setCoursePublished } from '../../../../services/courses.service'
import { assertAdminOrigin } from '../../../../utils/request-guards'
import { requireActiveAdmin } from '../../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  assertAdminOrigin(event)

  let id: string
  try {
    id = courseIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid course id' })
  }

  const course = await setCoursePublished(id, true)
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Curso no encontrado' })
  }
  return course
})
