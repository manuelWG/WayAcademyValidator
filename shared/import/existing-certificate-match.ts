import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'

/**
 * Result of resolving an incoming row against stored certificates.
 * Neon lookup is out of scope for 3A; the classifier receives this already built.
 */
export type ExistingCertificateMatch
  = | { kind: 'none' }
    | { kind: 'same_certificate', certificate: ComparableCertificate }
    | {
      kind: 'identity_collision'
      byCode: ComparableCertificate
      byIssueId: ComparableCertificate
    }
