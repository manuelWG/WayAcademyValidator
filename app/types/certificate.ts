import type { CertificateSnapshot } from '~~/shared/import/certificate-snapshot'

export type { CertificateMoodleIds, CertificateSnapshot } from '~~/shared/import/certificate-snapshot'

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
