import type { ImportBatch } from '../types/import'
import { seedCertificates } from './certificates'
import { normalizeCertificateCode } from '../utils/normalize-certificate-code'
import { normalizeDocument } from '../utils/normalize-document'
import { maskDocument } from '../utils/mask-document'

const cert1 = seedCertificates[0]!
const cert5 = seedCertificates[4]!

export const seedImports: ImportBatch[] = [
  {
    id: 'imp-1',
    originalFileName: 'liderazgo_marzo_2026.csv',
    fileHash: 'a3f8c1e29b07d4e6a1c8f0b2d5e7a9c1',
    courseLocalId: 'course-1',
    courseName: 'Liderazgo estratégico',
    importedBy: 'admin',
    importedAt: '2026-03-05T12:00:00.000Z',
    counters: { total: 2, new: 2, unchanged: 0, updatable: 0, conflicts: 0, errors: 0 },
    status: 'completed',
    rows: [
      {
        importId: 'imp-1',
        rowNumber: 2,
        originalFileName: 'liderazgo_marzo_2026.csv',
        fileHash: 'a3f8c1e29b07d4e6a1c8f0b2d5e7a9c1',
        certificateCode: 'WAY-LDR-2025-0042',
        participantName: 'María Fernanda Rojas',
        documentMasked: maskDocument('52.334.891'),
        status: 'new',
        reason: 'Certificado nuevo importado',
        storedSnapshot: null,
        incomingData: null,
        changedFields: []
      },
      {
        importId: 'imp-1',
        rowNumber: 3,
        originalFileName: 'liderazgo_marzo_2026.csv',
        fileHash: 'a3f8c1e29b07d4e6a1c8f0b2d5e7a9c1',
        certificateCode: 'WAY-LDR-2025-0043',
        participantName: 'Carlos Andrés Mejía',
        documentMasked: maskDocument('1.024.556.778'),
        status: 'new',
        reason: 'Certificado nuevo importado',
        storedSnapshot: null,
        incomingData: null,
        changedFields: []
      }
    ]
  },
  {
    id: 'imp-2',
    originalFileName: 'agiles_junio_2026.csv',
    fileHash: 'b7e2d0f41a68c3e9d2f5a8b1c4e7d0f2',
    courseLocalId: 'course-2',
    courseName: 'Gestión de proyectos ágiles',
    importedBy: 'admin',
    importedAt: '2026-06-28T09:15:00.000Z',
    counters: { total: 3, new: 2, unchanged: 1, updatable: 0, conflicts: 0, errors: 0 },
    status: 'completed',
    rows: []
  },
  {
    id: 'imp-3',
    originalFileName: 'liderazgo_reimport_jul2026.csv',
    fileHash: 'c1d4e7a0b3f6c9e2a5d8f1b4e7a0c3d6',
    courseLocalId: 'course-1',
    courseName: 'Liderazgo estratégico',
    importedBy: 'admin',
    importedAt: '2026-07-10T11:20:00.000Z',
    counters: { total: 4, new: 0, unchanged: 1, updatable: 1, conflicts: 2, errors: 0 },
    status: 'completed_with_conflicts',
    rows: [
      {
        importId: 'imp-3',
        rowNumber: 2,
        originalFileName: 'liderazgo_reimport_jul2026.csv',
        fileHash: 'c1d4e7a0b3f6c9e2a5d8f1b4e7a0c3d6',
        certificateCode: cert1.certificateCode,
        participantName: cert1.snapshot.participantName,
        documentMasked: maskDocument(cert1.snapshot.documentNumber),
        status: 'unchanged',
        reason: 'Sin diferencias respecto al snapshot publicado',
        storedSnapshot: cert1.snapshot,
        incomingData: {
          participantName: cert1.snapshot.participantName,
          documentNumber: cert1.snapshot.documentNumber,
          documentNumberNormalized: cert1.snapshot.documentNumberNormalized,
          courseName: cert1.snapshot.courseName,
          courseId: 101,
          certificateCode: cert1.certificateCode,
          certificateCodeNormalized: cert1.certificateCodeNormalized,
          issuedAt: cert1.snapshot.issuedAt,
          certificateIssueId: cert1.snapshot.moodle.certificateIssueId,
          certificateId: cert1.snapshot.moodle.certificateId,
          userId: cert1.snapshot.moodle.userId
        },
        changedFields: []
      },
      {
        importId: 'imp-3',
        rowNumber: 3,
        originalFileName: 'liderazgo_reimport_jul2026.csv',
        fileHash: 'c1d4e7a0b3f6c9e2a5d8f1b4e7a0c3d6',
        certificateCode: 'WAY-LDR-2025-0043',
        participantName: 'Carlos A. Mejía',
        documentMasked: maskDocument('1.024.556.778'),
        status: 'updatable',
        reason: 'Cambio menor en nombre; requiere decisión administrativa',
        storedSnapshot: seedCertificates[1]!.snapshot,
        incomingData: {
          participantName: 'Carlos A. Mejía',
          documentNumber: '1.024.556.778',
          documentNumberNormalized: normalizeDocument('1.024.556.778'),
          courseName: 'Liderazgo estratégico',
          courseId: 101,
          certificateCode: normalizeCertificateCode('WAY-LDR-2025-0043'),
          certificateCodeNormalized: normalizeCertificateCode('WAY-LDR-2025-0043'),
          issuedAt: '2025-11-18T15:22:00.000Z',
          certificateIssueId: 9002,
          certificateId: 501,
          userId: 1202
        },
        changedFields: ['participantName']
      },
      {
        importId: 'imp-3',
        rowNumber: 4,
        originalFileName: 'liderazgo_reimport_jul2026.csv',
        fileHash: 'c1d4e7a0b3f6c9e2a5d8f1b4e7a0c3d6',
        certificateCode: 'WAY-LDR-2026-0010',
        participantName: 'Ana Lucía Vargas Gómez',
        documentMasked: maskDocument('43.221.009'),
        status: 'critical_conflict',
        reason: 'Cambio de identidad: nombre del participante',
        storedSnapshot: seedCertificates[2]!.snapshot,
        incomingData: {
          participantName: 'Ana Lucía Vargas Gómez',
          documentNumber: '43.221.009',
          documentNumberNormalized: normalizeDocument('43.221.009'),
          courseName: 'Liderazgo estratégico',
          courseId: 101,
          certificateCode: 'WAY-LDR-2026-0010',
          certificateCodeNormalized: 'WAY-LDR-2026-0010',
          issuedAt: '2026-02-10T10:00:00.000Z',
          certificateIssueId: 9010,
          certificateId: 501,
          userId: 1203
        },
        changedFields: ['participantName']
      },
      {
        importId: 'imp-3',
        rowNumber: 5,
        originalFileName: 'liderazgo_reimport_jul2026.csv',
        fileHash: 'c1d4e7a0b3f6c9e2a5d8f1b4e7a0c3d6',
        certificateCode: 'WAY-LDR-2026-0011',
        participantName: 'Carlos Andrés Mejía',
        documentMasked: maskDocument('1.099.000.111'),
        status: 'critical_conflict',
        reason: 'Cambio de identidad: número de documento',
        storedSnapshot: seedCertificates[3]!.snapshot,
        incomingData: {
          participantName: 'Carlos Andrés Mejía',
          documentNumber: '1.099.000.111',
          documentNumberNormalized: normalizeDocument('1.099.000.111'),
          courseName: 'Liderazgo estratégico',
          courseId: 101,
          certificateCode: 'WAY-LDR-2026-0011',
          certificateCodeNormalized: 'WAY-LDR-2026-0011',
          issuedAt: '2026-02-10T10:05:00.000Z',
          certificateIssueId: 9011,
          certificateId: 501,
          userId: 1202
        },
        changedFields: ['documentNumber']
      }
    ]
  },
  {
    id: 'imp-4',
    originalFileName: 'agiles_parcial.csv',
    fileHash: 'd9e2f5a8b1c4e7d0f3a6b9c2e5f8a1b4',
    courseLocalId: 'course-2',
    courseName: 'Gestión de proyectos ágiles',
    importedBy: 'admin',
    importedAt: '2026-07-14T08:40:00.000Z',
    counters: { total: 2, new: 0, unchanged: 1, updatable: 0, conflicts: 1, errors: 0 },
    status: 'completed_with_conflicts',
    rows: [
      {
        importId: 'imp-4',
        rowNumber: 2,
        originalFileName: 'agiles_parcial.csv',
        fileHash: 'd9e2f5a8b1c4e7d0f3a6b9c2e5f8a1b4',
        certificateCode: cert5.certificateCode,
        participantName: cert5.snapshot.participantName,
        documentMasked: maskDocument(cert5.snapshot.documentNumber),
        status: 'unchanged',
        reason: 'Sin diferencias',
        storedSnapshot: cert5.snapshot,
        incomingData: null,
        changedFields: []
      }
    ]
  }
]
