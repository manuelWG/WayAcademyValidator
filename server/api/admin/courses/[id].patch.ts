import { courseIdParamSchema, updateCourseBodySchema } from '../../../../shared/schemas/course'
import { updateCourse } from '../../../services/courses.service'
import { readStrictJsonBody } from '../../../utils/request-guards'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)

  let id: string
  try {
    id = courseIdParamSchema.parse(getRouterParam(event, 'id'))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid course id' })
  }

  const body = await readStrictJsonBody(event, updateCourseBodySchema)

  try {
    const course = await updateCourse(id, body)
    if (!course) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Curso no encontrado' })
    }
    return course
  } catch (error: unknown) {
    if (isZodError(error)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid request body'
      })
    }
    throw error
  }
})

function isZodError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'ZodError')
}
