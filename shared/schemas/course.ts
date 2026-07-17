import { z } from 'zod'

export const COURSE_NAME_MIN = 1
export const COURSE_NAME_MAX = 255
export const COURSE_NOTES_MAX = 2000

export const moodleCourseIdSchema = z
  .number()
  .int()
  .positive()
  .refine(n => Number.isSafeInteger(n), 'moodleCourseId must be a safe integer')

export const courseNameSchema = z
  .string()
  .transform(s => s.trim())
  .pipe(z.string().min(COURSE_NAME_MIN).max(COURSE_NAME_MAX))

export const courseNotesSchema = z
  .string()
  .transform(s => s.trim())
  .pipe(z.string().max(COURSE_NOTES_MAX))

export const createCourseBodySchema = z
  .object({
    moodleCourseId: moodleCourseIdSchema,
    name: z.string(),
    notes: z.string().optional()
  })
  .strict()

export const updateCourseBodySchema = z
  .object({
    name: z.string(),
    notes: z.string().optional()
  })
  .strict()

export const courseIdParamSchema = z.string().uuid()
