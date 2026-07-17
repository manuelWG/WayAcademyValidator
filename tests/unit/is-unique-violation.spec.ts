import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from '../../server/utils/is-unique-violation'

describe('isUniqueViolation', () => {
  it('detects a direct PostgreSQL 23505 error', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
  })

  it('detects Drizzle-wrapped errors with cause.code 23505', () => {
    expect(isUniqueViolation({
      message: 'Failed query',
      cause: { code: '23505', detail: 'Key already exists' }
    })).toBe(true)
  })

  it('walks more than one level of cause', () => {
    expect(isUniqueViolation({
      message: 'outer',
      cause: {
        message: 'middle',
        cause: { code: '23505' }
      }
    })).toBe(true)
  })

  it('does not classify unrelated errors as unique violations', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
    expect(isUniqueViolation({
      message: 'duplicate key value violates unique constraint'
    })).toBe(false)
    expect(isUniqueViolation({
      cause: { message: 'unique violation without code' }
    })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation('23505')).toBe(false)
  })

  it('handles circular cause chains without infinite recursion', () => {
    const outer: { message: string, cause?: unknown } = { message: 'outer' }
    const inner: { message: string, cause?: unknown } = { message: 'inner', cause: outer }
    outer.cause = inner
    expect(isUniqueViolation(outer)).toBe(false)
  })

  it('stops on excessively deep cause chains', () => {
    let current: { cause?: unknown } = {}
    const root = current
    for (let i = 0; i < 20; i += 1) {
      current.cause = {}
      current = current.cause as { cause?: unknown }
    }
    current.cause = { code: '23505' }
    expect(isUniqueViolation(root)).toBe(false)
  })
})
