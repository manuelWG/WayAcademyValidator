import type { Course } from '../types/course'

export const seedCourses: Course[] = [
  {
    id: 'course-1',
    moodleCourseId: 101,
    name: 'Liderazgo estratégico',
    notes: 'Programa ejecutivo Way Group',
    isPublished: true,
    certificatesCount: 4,
    lastImportAt: '2026-06-12T14:30:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-06-12T14:30:00.000Z'
  },
  {
    id: 'course-2',
    moodleCourseId: 205,
    name: 'Gestión de proyectos ágiles',
    notes: '',
    isPublished: true,
    certificatesCount: 3,
    lastImportAt: '2026-06-28T09:15:00.000Z',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-06-28T09:15:00.000Z'
  },
  {
    id: 'course-3',
    moodleCourseId: 312,
    name: 'Cumplimiento normativo',
    notes: 'Pendiente de revisión de marca',
    isPublished: false,
    certificatesCount: 2,
    lastImportAt: '2026-07-02T16:45:00.000Z',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-07-02T16:45:00.000Z'
  },
  {
    id: 'course-4',
    moodleCourseId: 418,
    name: 'Comunicación efectiva',
    notes: '',
    isPublished: true,
    certificatesCount: 2,
    lastImportAt: '2026-05-20T11:00:00.000Z',
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-05-20T11:00:00.000Z'
  }
]
