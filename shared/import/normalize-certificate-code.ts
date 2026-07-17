/** Trim only; preserves letter case for exact matching after normalization. */
export function normalizeCertificateCode(value: string): string {
  return value.trim()
}
