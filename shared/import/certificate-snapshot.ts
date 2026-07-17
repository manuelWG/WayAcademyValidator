/** Snapshot fields used by import classification (code lives on ComparableCertificate). */
export interface CertificateMoodleIds {
  certificateIssueId: number
  certificateId: number
  courseId: number
  userId: number
}

export interface CertificateSnapshot {
  participantName: string
  documentNumber: string
  documentNumberNormalized: string
  courseName: string
  issuedAt: string
  moodle: CertificateMoodleIds
}
