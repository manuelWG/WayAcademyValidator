import { createCourse } from '../../../services/courses.service'
import { readStrictJsonBody } from '../../../utils/request-guards'
import { requireActiveAdmin } from '../../../utils/require-admin'
import { createCourseBodySchema } from '../../../../shared/schemas/course'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  const body = await readStrictJsonBody(event, createCourseBodySchema)
  try {
    const course = await createCourse(body)
    setResponseStatus(event, 201)
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
