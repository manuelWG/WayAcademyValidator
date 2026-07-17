import { createSeedState, type MockStoreState } from '../mock/seed'

export function useMockStore() {
  return useState<MockStoreState>('way-academy-validator-store', () => createSeedState())
}
