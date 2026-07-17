import type { Certificate } from '../types/certificate'
import { normalizeCertificateCode } from '../utils/normalize-certificate-code'
import { normalizeDocument } from '../utils/normalize-document'

function cert(partial: {
  id: string
  code: string
  participantName: string
  documentNumber: string
  courseName: string
  courseLocalId: string
  issuedAt: string
  importedAt: string
  publicVisible: boolean
  moodle: Certificate['snapshot']['moodle']
}): Certificate {
  return {
    id: partial.id,
    certificateCode: normalizeCertificateCode(partial.code),
    certificateCodeNormalized: normalizeCertificateCode(partial.code),
    snapshot: {
      participantName: partial.participantName,
      documentNumber: partial.documentNumber,
      documentNumberNormalized: normalizeDocument(partial.documentNumber),
      courseName: partial.courseName,
      issuedAt: partial.issuedAt,
      moodle: partial.moodle
    },
    courseLocalId: partial.courseLocalId,
    importedAt: partial.importedAt,
    publicVisible: partial.publicVisible
  }
}

export const seedCertificates: Certificate[] = [
  cert({
    id: 'cert-1',
    code: 'WAY-LDR-2025-0042',
    participantName: 'María Fernanda Rojas',
    documentNumber: '52.334.891',
    courseName: 'Liderazgo estratégico',
    courseLocalId: 'course-1',
    issuedAt: '2025-11-18T15:20:00.000Z',
    importedAt: '2026-03-05T12:00:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 9001, certificateId: 501, courseId: 101, userId: 1201 }
  }),
  cert({
    id: 'cert-2',
    code: 'WAY-LDR-2025-0043',
    participantName: 'Carlos Andrés Mejía',
    documentNumber: '1.024.556.778',
    courseName: 'Liderazgo estratégico',
    courseLocalId: 'course-1',
    issuedAt: '2025-11-18T15:22:00.000Z',
    importedAt: '2026-03-05T12:00:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 9002, certificateId: 501, courseId: 101, userId: 1202 }
  }),
  cert({
    id: 'cert-3',
    code: 'WAY-LDR-2026-0010',
    participantName: 'Ana Lucía Vargas',
    documentNumber: '43.221.009',
    courseName: 'Liderazgo estratégico',
    courseLocalId: 'course-1',
    issuedAt: '2026-02-10T10:00:00.000Z',
    importedAt: '2026-06-12T14:30:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 9010, certificateId: 501, courseId: 101, userId: 1203 }
  }),
  cert({
    id: 'cert-4',
    code: 'WAY-LDR-2026-0011',
    participantName: 'Carlos Andrés Mejía',
    documentNumber: '1.024.556.778',
    courseName: 'Liderazgo estratégico',
    courseLocalId: 'course-1',
    issuedAt: '2026-02-10T10:05:00.000Z',
    importedAt: '2026-06-12T14:30:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 9011, certificateId: 501, courseId: 101, userId: 1202 }
  }),
  cert({
    id: 'cert-5',
    code: 'WAY-AGL-2025-0201',
    participantName: 'María Fernanda Rojas',
    documentNumber: '52.334.891',
    courseName: 'Gestión de proyectos ágiles',
    courseLocalId: 'course-2',
    issuedAt: '2025-09-30T18:00:00.000Z',
    importedAt: '2026-04-01T09:00:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 8101, certificateId: 602, courseId: 205, userId: 1201 }
  }),
  cert({
    id: 'cert-6',
    code: 'WAY-AGL-2026-0033',
    participantName: 'Julián Esteban Pérez',
    documentNumber: '80.112.334',
    courseName: 'Gestión de proyectos ágiles',
    courseLocalId: 'course-2',
    issuedAt: '2026-05-14T12:30:00.000Z',
    importedAt: '2026-06-28T09:15:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 8133, certificateId: 602, courseId: 205, userId: 1301 }
  }),
  cert({
    id: 'cert-7',
    code: 'WAY-AGL-2026-0034',
    participantName: 'Sofía Camila Duarte',
    documentNumber: '1.098.765.432',
    courseName: 'Gestión de proyectos ágiles',
    courseLocalId: 'course-2',
    issuedAt: '2026-05-14T12:35:00.000Z',
    importedAt: '2026-06-28T09:15:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 8134, certificateId: 602, courseId: 205, userId: 1302 }
  }),
  cert({
    id: 'cert-8',
    code: 'WAY-CUM-2026-0001',
    participantName: 'Pedro Alfonso Quintero',
    documentNumber: '79.445.112',
    courseName: 'Cumplimiento normativo',
    courseLocalId: 'course-3',
    issuedAt: '2026-06-01T08:00:00.000Z',
    importedAt: '2026-07-02T16:45:00.000Z',
    publicVisible: false,
    moodle: { certificateIssueId: 7001, certificateId: 703, courseId: 312, userId: 1401 }
  }),
  cert({
    id: 'cert-9',
    code: 'WAY-CUM-2026-0002',
    participantName: 'Laura Isabel Gómez',
    documentNumber: '52.998.001',
    courseName: 'Cumplimiento normativo',
    courseLocalId: 'course-3',
    issuedAt: '2026-06-01T08:10:00.000Z',
    importedAt: '2026-07-02T16:45:00.000Z',
    publicVisible: false,
    moodle: { certificateIssueId: 7002, certificateId: 703, courseId: 312, userId: 1402 }
  }),
  cert({
    id: 'cert-10',
    code: 'WAY-COM-2025-0155',
    participantName: 'Ana Lucía Vargas',
    documentNumber: '43.221.009',
    courseName: 'Comunicación efectiva',
    courseLocalId: 'course-4',
    issuedAt: '2025-08-22T14:00:00.000Z',
    importedAt: '2026-05-20T11:00:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 6155, certificateId: 804, courseId: 418, userId: 1203 }
  }),
  cert({
    id: 'cert-11',
    code: 'WAY-COM-2026-0008',
    participantName: 'Julián Esteban Pérez',
    documentNumber: '80.112.334',
    courseName: 'Comunicación efectiva',
    courseLocalId: 'course-4',
    issuedAt: '2026-01-15T16:45:00.000Z',
    importedAt: '2026-05-20T11:00:00.000Z',
    publicVisible: true,
    moodle: { certificateIssueId: 6208, certificateId: 804, courseId: 418, userId: 1301 }
  })
]
