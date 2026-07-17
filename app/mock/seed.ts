import type { MockStoreState } from '../types/store'
import { seedCourses } from './courses'
import { seedCertificates } from './certificates'
import { seedImports } from './imports'
import { seedAuditConflicts } from './audit-conflicts'

export type { MockStoreState }

export function createSeedState(): MockStoreState {
  return {
    courses: structuredClone(seedCourses),
    certificates: structuredClone(seedCertificates),
    imports: structuredClone(seedImports),
    auditConflicts: structuredClone(seedAuditConflicts)
  }
}
