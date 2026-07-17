export type HttpErrorInfo = {
  statusCode?: number
  code?: string
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readNested(root: unknown, path: string[]): unknown {
  let current: unknown = root
  for (const key of path) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Safely read HTTP status and stable app code from $fetch/ofetch-style errors.
 */
export function readHttpError(error: unknown): HttpErrorInfo {
  if (!error || typeof error !== 'object') {
    return {}
  }

  const statusCode
    = asFiniteNumber(readNested(error, ['statusCode']))
      ?? asFiniteNumber(readNested(error, ['status']))
      ?? asFiniteNumber(readNested(error, ['response', 'status']))

  const code
    = asNonEmptyString(readNested(error, ['data', 'code']))
      ?? asNonEmptyString(readNested(error, ['data', 'data', 'code']))
      ?? asNonEmptyString(readNested(error, ['response', '_data', 'code']))
      ?? asNonEmptyString(readNested(error, ['response', '_data', 'data', 'code']))

  return {
    ...(statusCode !== undefined ? { statusCode } : {}),
    ...(code !== undefined ? { code } : {})
  }
}

/** Prefer stable app code; fall back to HTTP 409. */
export function isMoodleCourseIdTakenError(error: unknown): boolean {
  const { statusCode, code } = readHttpError(error)
  return code === 'MOODLE_COURSE_ID_TAKEN' || statusCode === 409
}
