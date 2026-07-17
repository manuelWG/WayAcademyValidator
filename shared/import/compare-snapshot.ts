import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'
import type { ImportIncomingData } from '~~/shared/schemas/import'
import { sortChangedFields } from '~~/shared/schemas/import'

/**
 * Diff stored comparable certificate vs incoming canonical row.
 * Returns changed field names in canonical order.
 */
export function compareCertificateToIncoming(
  stored: ComparableCertificate,
  incoming: ImportIncomingData
): string[] {
  const changed: string[] = []
  const snap = stored.snapshot

  if (stored.certificateCodeNormalized !== incoming.certificateCodeNormalized) {
    changed.push('certificateCode')
  }
  if (snap.moodle.certificateIssueId !== incoming.certificateIssueId) {
    changed.push('certificateIssueId')
  }
  if (snap.moodle.certificateId !== incoming.certificateId) {
    changed.push('certificateId')
  }
  if (snap.moodle.courseId !== incoming.courseId) {
    changed.push('courseId')
  }
  if (snap.moodle.userId !== incoming.userId) {
    changed.push('userId')
  }
  if (snap.participantName.trim() !== incoming.participantName.trim()) {
    changed.push('participantName')
  }
  if (snap.documentNumberNormalized !== incoming.documentNumberNormalized) {
    changed.push('documentNumberNormalized')
  }
  if (snap.courseName.trim() !== incoming.courseName.trim()) {
    changed.push('courseName')
  }
  if (snap.issuedAt !== incoming.issuedAt) {
    changed.push('issuedAt')
  }

  return sortChangedFields(changed)
}
