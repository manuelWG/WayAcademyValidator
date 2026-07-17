import { describe, expect, it } from 'vitest'
import { resolveDatabaseUrl, resetDbClientForTests, useDb } from '../../server/database/client'

describe('database client lazy init', () => {
  it('resolveDatabaseUrl does not throw without DATABASE_URL', () => {
    const prev = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    resetDbClientForTests()
    expect(resolveDatabaseUrl()).toBeUndefined()
    if (prev !== undefined) process.env.DATABASE_URL = prev
  })

  it('importing client module does not require DATABASE_URL', async () => {
    const prev = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    resetDbClientForTests()
    const mod = await import('../../server/database/client')
    expect(typeof mod.useDb).toBe('function')
    expect(mod.resolveDatabaseUrl()).toBeUndefined()
    if (prev !== undefined) process.env.DATABASE_URL = prev
  })

  it('useDb throws a controlled error only when used without URL', () => {
    const prev = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    resetDbClientForTests()
    expect(() => useDb()).toThrow()
    if (prev !== undefined) process.env.DATABASE_URL = prev
  })
})
