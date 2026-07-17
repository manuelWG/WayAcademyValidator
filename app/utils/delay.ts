export function delay(ms = 700): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
