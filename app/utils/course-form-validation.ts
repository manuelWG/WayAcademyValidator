import { parseMoodleCourseIdInput } from './parse-moodle-course-id'

export type CourseFormErrors = {
  moodleCourseId: string
  name: string
  notes: string
}

export function emptyCourseFormErrors(): CourseFormErrors {
  return {
    moodleCourseId: '',
    name: '',
    notes: ''
  }
}

/**
 * Value for UFormField.error — never pass an empty string (avoids permanent red borders).
 */
export function formFieldError(message: string): string | undefined {
  return message || undefined
}

export function clearCourseFormFieldError(
  errors: CourseFormErrors,
  field: keyof CourseFormErrors
): void {
  errors[field] = ''
}

export type CourseFormValidationResult
  = { ok: true, moodleCourseId: number, errors: CourseFormErrors }
    | { ok: false, errors: CourseFormErrors }

export function validateCourseForm(input: {
  moodleCourseId: string
  name: string
  notes: string
}): CourseFormValidationResult {
  const errors = emptyCourseFormErrors()
  const parsed = parseMoodleCourseIdInput(input.moodleCourseId)

  if (!parsed.ok) {
    errors.moodleCourseId = parsed.error
  }

  const trimmedName = input.name.trim()
  if (!trimmedName) {
    errors.name = 'Requerido'
  } else if (trimmedName.length > 255) {
    errors.name = 'Máximo 255 caracteres'
  }

  if (input.notes.trim().length > 2000) {
    errors.notes = 'Máximo 2000 caracteres'
  }

  if (!parsed.ok || errors.moodleCourseId || errors.name || errors.notes) {
    return { ok: false, errors }
  }

  return { ok: true, moodleCourseId: parsed.value, errors }
}
