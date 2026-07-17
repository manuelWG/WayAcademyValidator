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

export interface Certificate {
  id: string
  certificateCode: string
  certificateCodeNormalized: string
  snapshot: CertificateSnapshot
  courseLocalId: string
  importedAt: string
  publicVisible: boolean
}

export interface CertificatePublicResult {
  certificate: Certificate
  verifiedAt: string
}
