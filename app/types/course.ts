export interface Course {
  id: string
  moodleCourseId: number
  name: string
  notes: string
  isPublished: boolean
  certificatesCount: number
  lastImportAt: string | null
  createdAt: string
}
