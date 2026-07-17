export type ParseMoodleCourseIdResult
  = { ok: true, value: number }
    | { ok: false, error: string }

/**
 * Normalize and validate a Moodle course id from form input.
 * Accepts text (preferred) or an unexpected number from type="number" bindings.
 */
export function parseMoodleCourseIdInput(value: unknown): ParseMoodleCourseIdResult {
  const idRaw = String(value ?? '').trim()
  if (!idRaw) {
    return { ok: false, error: 'Requerido' }
  }
  // Digits only after trim: rejects decimals, exponents, signs, and internal spaces.
  if (!/^\d+$/.test(idRaw)) {
    return { ok: false, error: 'Debe ser un entero positivo válido' }
  }
  const idNum = Number(idRaw)
  if (!Number.isSafeInteger(idNum) || idNum <= 0) {
    return { ok: false, error: 'Debe ser un entero positivo válido' }
  }
  return { ok: true, value: idNum }
}

/** Text value shown in the Moodle ID field (create vs edit). */
export function moodleCourseIdFieldValue(initialId: number | undefined): string {
  return initialId != null ? String(initialId) : ''
}

/** Existing courses keep Moodle ID locked during edit. */
export function isMoodleCourseIdFieldDisabled(initialId: number | undefined): boolean {
  return !!initialId
}
