/**
 * Removes spaces, dots and hyphens; uppercases letters.
 * Does not strip alphabetic characters.
 */
export function normalizeDocument(value: string): string {
  return value
    .replace(/[\s.-]/g, '')
    .toUpperCase()
}
