import { describe, expect, it } from 'vitest'
import bcrypt from 'bcryptjs'
import {
  createCourseBodySchema,
  moodleCourseIdSchema,
  courseNameSchema,
  courseNotesSchema,
  courseIdParamSchema
} from '../../shared/schemas/course'
import {
  normalizedUsernameSchema,
  displayNameSchema,
  loginBodySchema
} from '../../shared/schemas/auth'
import {
  validatePasswordPolicy,
  DUMMY_PASSWORD_HASH
} from '../../server/utils/password'

describe('auth schemas', () => {
  it('normalizes and validates username', () => {
    expect(normalizedUsernameSchema.parse('  Admin.User_1  ')).toBe('admin.user_1')
    expect(() => normalizedUsernameSchema.parse('ab')).toThrow()
    expect(() => normalizedUsernameSchema.parse('Bad User')).toThrow()
    expect(() => normalizedUsernameSchema.parse('Ádmin')).toThrow()
  })

  it('validates display name', () => {
    expect(displayNameSchema.parse('  Ana  ')).toBe('Ana')
    expect(() => displayNameSchema.parse('')).toThrow()
    expect(() => displayNameSchema.parse('x'.repeat(121))).toThrow()
  })

  it('rejects unexpected login fields', () => {
    expect(() => loginBodySchema.parse({ username: 'a', password: 'b', extra: true })).toThrow()
  })
})

describe('password policy', () => {
  it('enforces min length, letter and digit', () => {
    expect(validatePasswordPolicy('short1')).toBe('too_short')
    expect(validatePasswordPolicy('nodigitshere!!')).toBe('missing_digit')
    expect(validatePasswordPolicy('123456789012')).toBe('missing_letter')
    expect(validatePasswordPolicy('ValidPass12x')).toBeNull()
  })

  it('rejects passwords bcrypt would truncate', () => {
    const oversized = `A1${'a'.repeat(71)}`
    expect(bcrypt.truncates(oversized)).toBe(true)
    expect(validatePasswordPolicy(oversized)).toBe('bcrypt_truncates')
  })

  it('dummy hash is not a functional credential for typical passwords', async () => {
    expect(await bcrypt.compare('demo1234', DUMMY_PASSWORD_HASH)).toBe(false)
    expect(await bcrypt.compare('ValidPass12', DUMMY_PASSWORD_HASH)).toBe(false)
  })
})

describe('course schemas', () => {
  it('validates moodleCourseId as safe positive int', () => {
    expect(moodleCourseIdSchema.parse(101)).toBe(101)
    expect(() => moodleCourseIdSchema.parse(0)).toThrow()
    expect(() => moodleCourseIdSchema.parse(-1)).toThrow()
    expect(() => moodleCourseIdSchema.parse(1.5)).toThrow()
    expect(() => moodleCourseIdSchema.parse(Number.NaN)).toThrow()
  })

  it('trims course name and notes', () => {
    expect(courseNameSchema.parse('  Curso  ')).toBe('Curso')
    expect(courseNotesSchema.parse('  hi  ')).toBe('hi')
    expect(courseNotesSchema.parse('')).toBe('')
    expect(() => courseNameSchema.parse('')).toThrow()
    expect(() => courseNotesSchema.parse('x'.repeat(2001))).toThrow()
  })

  it('rejects unexpected create fields', () => {
    expect(() => createCourseBodySchema.parse({
      moodleCourseId: 1,
      name: 'A',
      hack: true
    })).toThrow()
  })

  it('validates UUID course ids', () => {
    expect(courseIdParamSchema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    )
    expect(() => courseIdParamSchema.parse('course-1')).toThrow()
  })
})
