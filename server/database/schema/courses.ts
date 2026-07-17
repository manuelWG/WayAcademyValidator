import { bigint, boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  moodleCourseId: bigint('moodle_course_id', { mode: 'number' }).notNull().unique(),
  name: text('name').notNull(),
  notes: text('notes').notNull().default(''),
  isPublished: boolean('is_published').notNull().default(false),
  lastImportAt: timestamp('last_import_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})
