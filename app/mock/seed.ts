import type { MockStoreState } from '../types/store'
import { seedCourses } from './courses'
import { seedCertificates } from './certificates'

export type { MockStoreState }

export function createSeedState(): MockStoreState {
  return {
    courses: structuredClone(seedCourses),
    certificates: structuredClone(seedCertificates)
  }
}
