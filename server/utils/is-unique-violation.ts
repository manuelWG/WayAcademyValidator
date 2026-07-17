/** PostgreSQL unique_violation */
const PG_UNIQUE_VIOLATION = '23505'

/** Max depth when walking nested `cause` chains (Drizzle wrappers, etc.). */
const MAX_CAUSE_DEPTH = 8

/**
 * Detect PostgreSQL unique violations, including errors wrapped by Drizzle
 * under one or more `cause` properties. Does not rely on message text.
 */
export function isUniqueViolation(error: unknown): boolean {
  const visited = new Set<object>()
  let current: unknown = error
  let depth = 0

  while (current != null && typeof current === 'object' && depth <= MAX_CAUSE_DEPTH) {
    if (visited.has(current)) {
      return false
    }
    visited.add(current)

    const code = (current as { code?: unknown }).code
    if (code === PG_UNIQUE_VIOLATION) {
      return true
    }

    current = (current as { cause?: unknown }).cause
    depth += 1
  }

  return false
}
