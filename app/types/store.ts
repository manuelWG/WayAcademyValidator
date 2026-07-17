import type { Course } from './course'
import type { Certificate } from './certificate'
import type { ImportBatch } from './import'
import type { AuditConflict } from './audit'

export interface MockStoreState {
  courses: Course[]
  certificates: Certificate[]
  imports: ImportBatch[]
  auditConflicts: AuditConflict[]
}
