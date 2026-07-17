import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  clearCourseFormFieldError,
  emptyCourseFormErrors,
  formFieldError,
  validateCourseForm
} from '../../app/utils/course-form-validation'
import {
  isMoodleCourseIdFieldDisabled,
  moodleCourseIdFieldValue
} from '../../app/utils/parse-moodle-course-id'

describe('course form field errors', () => {
  it('starts without an error value for UFormField', () => {
    const errors = emptyCourseFormErrors()
    expect(formFieldError(errors.moodleCourseId)).toBeUndefined()
    expect(formFieldError(errors.name)).toBeUndefined()
    expect(formFieldError(errors.notes)).toBeUndefined()
  })

  it('exposes errors only after a failed validation', () => {
    const before = emptyCourseFormErrors()
    expect(formFieldError(before.moodleCourseId)).toBeUndefined()

    const result = validateCourseForm({
      moodleCourseId: '',
      name: '',
      notes: ''
    })
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(formFieldError(result.errors.moodleCourseId)).toBe('Requerido')
    expect(formFieldError(result.errors.name)).toBe('Requerido')
    expect(formFieldError(result.errors.notes)).toBeUndefined()
  })

  it('clears a field error when that field is edited again', () => {
    const errors = emptyCourseFormErrors()
    const invalid = validateCourseForm({
      moodleCourseId: 'abc',
      name: 'Curso',
      notes: ''
    })
    Object.assign(errors, invalid.errors)
    expect(formFieldError(errors.moodleCourseId)).toBe('Debe ser un entero positivo válido')

    clearCourseFormFieldError(errors, 'moodleCourseId')
    expect(formFieldError(errors.moodleCourseId)).toBeUndefined()
    expect(formFieldError(errors.name)).toBeUndefined()
  })

  it('keeps existing validation rules for name and notes', () => {
    const tooLongName = validateCourseForm({
      moodleCourseId: '101',
      name: 'x'.repeat(256),
      notes: ''
    })
    expect(tooLongName.ok).toBe(false)
    if (!tooLongName.ok) {
      expect(tooLongName.errors.name).toBe('Máximo 255 caracteres')
    }

    const tooLongNotes = validateCourseForm({
      moodleCourseId: '101',
      name: 'Curso',
      notes: 'y'.repeat(2001)
    })
    expect(tooLongNotes.ok).toBe(false)
    if (!tooLongNotes.ok) {
      expect(tooLongNotes.errors.notes).toBe('Máximo 2000 caracteres')
    }

    const valid = validateCourseForm({
      moodleCourseId: '101',
      name: 'Curso',
      notes: 'Interno'
    })
    expect(valid).toEqual({
      ok: true,
      moodleCourseId: 101,
      errors: emptyCourseFormErrors()
    })
  })
})

describe('CourseForm create/edit wiring', () => {
  it('keeps an existing Moodle ID as disabled text during edit', () => {
    expect(moodleCourseIdFieldValue(101)).toBe('101')
    expect(isMoodleCourseIdFieldDisabled(101)).toBe(true)
    expect(isMoodleCourseIdFieldDisabled(undefined)).toBe(false)
    expect(moodleCourseIdFieldValue(undefined)).toBe('')
  })

  it('CourseForm uses neutral error binding and create/edit behavior', () => {
    const source = readFileSync('app/components/admin/CourseForm.vue', 'utf8')
    expect(source).toMatch(/type="text"/)
    expect(source).toMatch(/inputmode="numeric"/)
    expect(source).toMatch(/pattern="\[0-9\]\*"/)
    expect(source).not.toMatch(/type="number"/)
    expect(source).not.toMatch(/v-model\.number/)
    expect(source).toMatch(/formFieldError\(errors\.moodleCourseId\)/)
    expect(source).toMatch(/formFieldError\(errors\.name\)/)
    expect(source).toMatch(/formFieldError\(errors\.notes\)/)
    expect(source).toMatch(/validateCourseForm/)
    expect(source).toMatch(/clearCourseFormFieldError/)
    expect(source).toMatch(/isMoodleCourseIdFieldDisabled/)
    expect(source).toMatch(/:rows="5"/)
    expect(source).toMatch(/max-w-2xl/)
    expect(source).toMatch(/Publicación bajo tu control/)
    expect(source).toMatch(/if \(props\.loading\) return/)
  })
})
