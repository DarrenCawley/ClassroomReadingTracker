import { pgEnum, pgTable, integer, uuid, text, timestamp, unique, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  bio: text('bio'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  totalPages: integer('total_pages'),
  authorId: uuid('author_id').references(() => authors.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  year: integer('year'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const readingStatus = pgEnum('reading_status', ['not_started', 'reading', 'finished'])

export const readingAssignments = pgTable(
  'reading_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id),
    currentPage: integer('current_page').notNull().default(0),
    status: readingStatus('status').notNull().default('not_started'),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('reading_assignments_student_book_unique').on(table.studentId, table.bookId),
    check('reading_assignments_current_page_nonnegative', sql`${table.currentPage} >= 0`),
  ],
)
