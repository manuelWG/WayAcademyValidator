import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  isMoodleCourseIdFieldDisabled,
  moodleCourseIdFieldValue,
  parseMoodleCourseIdInput
} from '../../app/utils/parse-moodle-course-id'

describe('parseMoodleCourseIdInput', () => {
  it('accepts "101" and converts to 101', () => {
    expect(parseMoodleCourseIdInput('101')).toEqual({ ok: true, value: 101 })
  })

  it('handles an unexpected number 101 defensively', () => {
    expect(parseMoodleCourseIdInput(101)).toEqual({ ok: true, value: 101 })
  })

  it('accepts " 101 " after trim', () => {
    expect(parseMoodleCourseIdInput(' 101 ')).toEqual({ ok: true, value: 101 })
  })

  it('rejects empty string with Requerido', () => {
    expect(parseMoodleCourseIdInput('')).toEqual({ ok: false, error: 'Requerido' })
    expect(parseMoodleCourseIdInput('   ')).toEqual({ ok: false, error: 'Requerido' })
    expect(parseMoodleCourseIdInput(null)).toEqual({ ok: false, error: 'Requerido' })
    expect(parseMoodleCourseIdInput(undefined)).toEqual({ ok: false, error: 'Requerido' })
  })

  it('rejects decimals like "1.5"', () => {
    expect(parseMoodleCourseIdInput('1.5')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })

  it('rejects exponential notation like "1e3"', () => {
    expect(parseMoodleCourseIdInput('1e3')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })

  it('rejects signs like "-1"', () => {
    expect(parseMoodleCourseIdInput('-1')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
    expect(parseMoodleCourseIdInput('+1')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })

  it('rejects non-digits like "abc"', () => {
    expect(parseMoodleCourseIdInput('abc')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })

  it('rejects values above Number.MAX_SAFE_INTEGER', () => {
    const tooLarge = String(Number.MAX_SAFE_INTEGER + 1)
    expect(parseMoodleCourseIdInput(tooLarge)).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })

  it('rejects zero and internal spaces', () => {
    expect(parseMoodleCourseIdInput('0')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
    expect(parseMoodleCourseIdInput('10 1')).toEqual({
      ok: false,
      error: 'Debe ser un entero positivo válido'
    })
  })
})

describe('CourseForm moodle id field (edit)', () => {
  it('keeps an existing Moodle ID as disabled text during edit', () => {
    expect(moodleCourseIdFieldValue(101)).toBe('101')
    expect(isMoodleCourseIdFieldDisabled(101)).toBe(true)
    expect(isMoodleCourseIdFieldDisabled(undefined)).toBe(false)
    expect(moodleCourseIdFieldValue(undefined)).toBe('')
  })

  it('CourseForm wires text input and disabled edit without number coercion', () => {
    const source = readFileSync('app/components/admin/CourseForm.vue', 'utf8')
    expect(source).toMatch(/type="text"/)
    expect(source).toMatch(/inputmode="numeric"/)
    expect(source).toMatch(/pattern="\[0-9\]\*"/)
    expect(source).not.toMatch(/type="number"/)
    expect(source).not.toMatch(/v-model\.number/)
    expect(source).toMatch(/parseMoodleCourseIdInput/)
    expect(source).toMatch(/isMoodleCourseIdFieldDisabled/)
    expect(source).toMatch(/moodleCourseId:\s*idNum/)
  })
})
