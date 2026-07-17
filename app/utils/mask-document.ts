import { normalizeDocument } from './normalize-document'

/** Masks a document number showing only the last 2 characters. */
export function maskDocument(value: string): string {
  const normalized = normalizeDocument(value)
  if (!normalized) return '********'
  if (normalized.length <= 2) return '*'.repeat(normalized.length)
  const visible = normalized.slice(-2)
  return `${'*'.repeat(Math.max(normalized.length - 2, 4))}${visible}`
}
