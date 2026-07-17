import { describe, expect, it } from 'vitest'
import type { ComparableCertificate } from '~~/shared/import/comparable-certificate'
import { compareCertificateToIncoming } from '~~/shared/import/compare-snapshot'
import type { ImportIncomingData } from '~~/shared/schemas/import'

function baseIncoming(overrides: Partial<ImportIncomingData> = {}): ImportIncomingData {
  return {
    participantName: 'Ana Rojas',
    documentNumber: '52.334.891',
    documentNumberNormalized: '52334891',
    courseName: 'Liderazgo',
    courseId: 101,
    certificateCode: 'WAY-ABC-01',
    certificateCodeNormalized: 'WAY-ABC-01',
    issuedAt: '2026-01-15T12:00:00.000Z',
    certificateIssueId: 9001,
    certificateId: 501,
    userId: 1201,
    ...overrides
  }
}

function baseStored(overrides?: {
  code?: string
  codeNormalized?: string
  incoming?: Partial<ImportIncomingData>
}): ComparableCertificate {
  const incoming = baseIncoming(overrides?.incoming)
  return {
    certificateCode: overrides?.code ?? incoming.certificateCode,
    certificateCodeNormalized: overrides?.codeNormalized ?? incoming.certificateCodeNormalized,
    snapshot: {
      participantName: incoming.participantName,
      documentNumber: incoming.documentNumber,
      documentNumberNormalized: incoming.documentNumberNormalized,
      courseName: incoming.courseName,
      issuedAt: incoming.issuedAt,
      moodle: {
        certificateIssueId: incoming.certificateIssueId,
        certificateId: incoming.certificateId,
        courseId: incoming.courseId,
        userId: incoming.userId
      }
    }
  }
}

describe('compareCertificateToIncoming', () => {
  it('returns empty when equal', () => {
    const incoming = baseIncoming()
    expect(compareCertificateToIncoming(baseStored(), incoming)).toEqual([])
  })

  it('compares code via ComparableCertificate normalized code', () => {
    const stored = baseStored({ code: ' WAY-OLD ', codeNormalized: 'WAY-OLD' })
    const incoming = baseIncoming({
      certificateCode: 'WAY-NEW',
      certificateCodeNormalized: 'WAY-NEW'
    })
    expect(compareCertificateToIncoming(stored, incoming)).toEqual(['certificateCode'])
  })

  it('emits changedFields in canonical order', () => {
    const stored = baseStored()
    const incoming = baseIncoming({
      issuedAt: '2026-02-01T00:00:00.000Z',
      participantName: 'Otra',
      certificateId: 999
    })
    expect(compareCertificateToIncoming(stored, incoming)).toEqual([
      'certificateId',
      'participantName',
      'issuedAt'
    ])
  })

  it('compares names and courseName with outer trim only', () => {
    const stored = baseStored({
      incoming: { participantName: ' Ana ', courseName: ' Curso ' }
    })
    expect(
      compareCertificateToIncoming(
        stored,
        baseIncoming({ participantName: 'Ana', courseName: 'Curso' })
      )
    ).toEqual([])
    expect(
      compareCertificateToIncoming(
        stored,
        baseIncoming({ participantName: 'An a', courseName: 'Curso' })
      )
    ).toEqual(['participantName'])
  })

  it('compares document by normalized value', () => {
    const stored = baseStored()
    expect(
      compareCertificateToIncoming(
        stored,
        baseIncoming({
          documentNumber: '52.334.891',
          documentNumberNormalized: '52334891'
        })
      )
    ).toEqual([])
    expect(
      compareCertificateToIncoming(
        stored,
        baseIncoming({
          documentNumber: '99.999.999',
          documentNumberNormalized: '99999999'
        })
      )
    ).toEqual(['documentNumberNormalized'])
  })
})
