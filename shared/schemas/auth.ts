import { z } from 'zod'

export const USERNAME_MIN = 3
export const USERNAME_MAX = 64
export const DISPLAY_NAME_MIN = 1
export const DISPLAY_NAME_MAX = 120
export const PASSWORD_MIN_CHARS = 12

/** ASCII lowercase letters, digits, `.`, `-`, `_` only (after normalize). */
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export const normalizedUsernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(USERNAME_MIN)
      .max(USERNAME_MAX)
      .regex(USERNAME_PATTERN, 'Invalid username format')
  )

export const displayNameSchema = z
  .string()
  .transform(s => s.trim())
  .pipe(
    z.string().min(DISPLAY_NAME_MIN).max(DISPLAY_NAME_MAX)
  )

export const loginBodySchema = z
  .object({
    username: z.string(),
    password: z.string()
  })
  .strict()

export const createAdminInputSchema = z
  .object({
    username: z.string(),
    displayName: z.string(),
    password: z.string()
  })
  .strict()
