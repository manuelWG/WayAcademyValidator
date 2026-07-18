import type { Course } from './course'
import type { Certificate } from './certificate'

export interface MockStoreState {
  courses: Course[]
  certificates: Certificate[]
}
