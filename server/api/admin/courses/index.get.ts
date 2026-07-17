import { listCourses } from '../../../services/courses.service'
import { requireActiveAdmin } from '../../../utils/require-admin'

export default defineEventHandler(async (event) => {
  await requireActiveAdmin(event)
  return listCourses()
})
