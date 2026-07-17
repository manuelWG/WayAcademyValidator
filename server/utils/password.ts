import bcrypt from 'bcryptjs'
import { PASSWORD_MIN_CHARS } from '../../shared/schemas/auth'

const BCRYPT_COST = 12

/**
 * Precomputed bcrypt hash (cost 12) of a non-credential sentinel.
 * Used only to equalize timing when the username does not exist.
 * This hash must never validate a real login.
 */
export const DUMMY_PASSWORD_HASH
  = '$2b$12$m7qgq.cC68jYHWoBdT5njuBpep8qk2e1onQFEIqVB2mlT0a9O9mx6'

export type PasswordPolicyError
  = | 'too_short'
    | 'missing_letter'
    | 'missing_digit'
    | 'bcrypt_truncates'

export function validatePasswordPolicy(password: string): PasswordPolicyError | null {
  if (password.length < PASSWORD_MIN_CHARS) return 'too_short'
  if (!/[A-Za-z]/.test(password)) return 'missing_letter'
  if (!/[0-9]/.test(password)) return 'missing_digit'
  if (bcrypt.truncates(password)) return 'bcrypt_truncates'
  return null
}

export function passwordPolicyMessage(error: PasswordPolicyError): string {
  switch (error) {
    case 'too_short':
      return `La contraseña debe tener al menos ${PASSWORD_MIN_CHARS} caracteres.`
    case 'missing_letter':
      return 'La contraseña debe incluir al menos una letra.'
    case 'missing_digit':
      return 'La contraseña debe incluir al menos un número.'
    case 'bcrypt_truncates':
      return 'La contraseña supera el límite de 72 bytes UTF-8 admitido por bcrypt.'
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  const policyError = validatePasswordPolicy(password)
  if (policyError) {
    throw new Error(passwordPolicyMessage(policyError))
  }
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyAdminPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function verifyPasswordAgainstDummy(password: string): Promise<boolean> {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH)
}
