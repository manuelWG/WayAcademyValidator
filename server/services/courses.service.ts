import { asc, eq } from 'drizzle-orm'
import {
  courseNameSchema,
  courseNotesSchema,
  createCourseBodySchema,
  moodleCourseIdSchema,
  updateCourseBodySchema
} from '../../shared/schemas/course'
import type { Course } from '../../app/types/course'
import { useDb } from '../database/client'
import { courses } from '../database/schema'
import { isUniqueViolation } from '../utils/is-unique-violation'

type CourseRow = typeof courses.$inferSelect

function toCourseDto(row: CourseRow): Course {
  return {
    id: row.id,
    moodleCourseId: row.moodleCourseId,
    name: row.name,
    notes: row.notes,
    isPublished: row.isPublished,
    certificatesCount: 0,
    lastImportAt: row.lastImportAt ? row.lastImportAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export async function listCourses(): Promise<Course[]> {
  const database = useDb()
  const rows = await database.select().from(courses).orderBy(asc(courses.createdAt))
  return rows.map(toCourseDto)
}

export async function getCourseById(id: string): Promise<Course | null> {
  const database = useDb()
  const [row] = await database.select().from(courses).where(eq(courses.id, id)).limit(1)
  return row ? toCourseDto(row) : null
}

export async function createCourse(input: unknown): Promise<Course> {
  const parsed = createCourseBodySchema.parse(input)
  const name = courseNameSchema.parse(parsed.name)
  const notes = courseNotesSchema.parse(parsed.notes ?? '')
  const moodleCourseId = moodleCourseIdSchema.parse(parsed.moodleCourseId)

  const database = useDb()
  try {
    const [row] = await database
      .insert(courses)
      .values({
        moodleCourseId,
        name,
        notes,
        isPublished: false
      })
      .returning()

    if (!row) {
      throw createError({ statusCode: 500, message: 'No se pudo crear el curso' })
    }
    return toCourseDto(row)
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        data: { code: 'MOODLE_COURSE_ID_TAKEN' },
        message: 'Ya existe un curso con ese moodleCourseId'
      })
    }
    throw error
  }
}

export async function updateCourse(id: string, input: unknown): Promise<Course | null> {
  const parsed = updateCourseBodySchema.parse(input)
  const name = courseNameSchema.parse(parsed.name)
  const notes = courseNotesSchema.parse(parsed.notes ?? '')

  const database = useDb()
  const [row] = await database
    .update(courses)
    .set({
      name,
      notes,
      updatedAt: new Date()
    })
    .where(eq(courses.id, id))
    .returning()

  return row ? toCourseDto(row) : null
}

export async function setCoursePublished(id: string, isPublished: boolean): Promise<Course | null> {
  const database = useDb()
  const [row] = await database
    .update(courses)
    .set({
      isPublished,
      updatedAt: new Date()
    })
    .where(eq(courses.id, id))
    .returning()

  return row ? toCourseDto(row) : null
}
