export interface AdminUser {
  username: string
  displayName: string
}

export interface AdminSession {
  authenticated: boolean
  user: AdminUser | null
}

export interface DashboardStats {
  publishedCourses: number
  importedCertificates: number
  participantsWithCertificates: number
  lastImportAt: string | null
  pendingConflicts: number
}
