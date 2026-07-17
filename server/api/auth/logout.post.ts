import { assertAdminOrigin } from '../../utils/request-guards'

export default defineEventHandler(async (event) => {
  assertAdminOrigin(event)
  await clearUserSession(event)
  setResponseStatus(event, 204)
  return null
})
