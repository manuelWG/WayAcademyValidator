import { authenticateAdmin, parseLoginBody } from '../../services/auth.service'
import { assertAdminOrigin, assertJsonContentType } from '../../utils/request-guards'

export default defineEventHandler(async (event) => {
  assertJsonContentType(event)
  assertAdminOrigin(event)

  let body: { username: string, password: string }
  try {
    body = parseLoginBody(await readBody(event))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request body'
    })
  }

  const result = await authenticateAdmin(body.username, body.password)

  if (!result.ok && result.reason === 'bootstrap') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { code: 'BOOTSTRAP_REQUIRED' },
      message: 'No hay administradores configurados'
    })
  }

  if (!result.ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Credenciales inválidas'
    })
  }

  await replaceUserSession(event, {
    user: {
      id: result.user.id,
      username: result.user.username,
      displayName: result.user.displayName
    },
    loggedInAt: Date.now()
  })

  return { user: result.user }
})
