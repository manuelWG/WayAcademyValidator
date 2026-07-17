import type { CertificateSnapshot } from '~~/shared/import/certificate-snapshot'

/** Stored certificate identity for comparison (snapshot alone has no code). */
export type ComparableCertificate = {
  certificateCode: string
  certificateCodeNormalized: string
  snapshot: CertificateSnapshot
}
