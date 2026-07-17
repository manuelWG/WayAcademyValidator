import type { H3Event } from 'h3'
import { getRequestHeader, getRequestURL } from 'h3'

const JSON_TYPE = /^application\/json(?:\s*;.*)?$/i

export function assertJsonContentType(event: H3Event) {
  const contentType = getRequestHeader(event, 'content-type')
  if (!contentType || !JSON_TYPE.test(contentType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Unsupported Media Type',
      message: 'Content-Type must be application/json'
    })
  }
}

/**
 * Origin check for admin mutations.
 * Allows same-origin requests; rejects missing/mismatched Origin on browser requests.
 */
export function assertAdminOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  const url = getRequestURL(event)
  const expected = url.origin

  // Non-browser clients (curl/scripts) may omit Origin; require it for browser CORS-style calls.
  // Sec-Fetch-Site: same-origin / none are acceptable when Origin matches or is absent with same host Referer.
  if (!origin) {
    const secFetchSite = getRequestHeader(event, 'sec-fetch-site')
    if (secFetchSite === 'cross-site') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Invalid request origin'
      })
    }
    return
  }

  if (origin !== expected) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Invalid request origin'
    })
  }
}

export async function readStrictJsonBody<T>(event: H3Event, schema: { parse: (data: unknown) => T }): Promise<T> {
  assertJsonContentType(event)
  assertAdminOrigin(event)
  const body = await readBody(event)
  try {
    return schema.parse(body)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request body'
    })
  }
}
