import { Router } from 'express'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index'
import { books, students, readingAssignments } from '../db/schema'

export const assignmentsRouter = Router()
const uuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export function validProgress(page: unknown, status: unknown) {
  return (
    typeof page === 'number' &&
    Number.isInteger(page) &&
    page >= 0 &&
    page <= 2147483647 &&
    ['not_started', 'reading', 'finished'].includes(status as string)
  )
}

assignmentsRouter.get('/', async (_req, res) => {
  const results = await db
    .select()
    .from(readingAssignments)
    .orderBy(readingAssignments.updatedAt, readingAssignments.id)
  res.json(results)
})

assignmentsRouter.post('/', async (req, res) => {
  const { studentId, bookId, currentPage = 0, status = 'not_started' } = req.body ?? {}
  if (!uuid(studentId) || !uuid(bookId) || !validProgress(currentPage, status)) {
    res
      .status(400)
      .json({
        error: 'Choose a student and book, a valid status, and a non-negative whole page number.',
      })
    return
  }
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
  const [book] = await db
    .select({ totalPages: books.totalPages })
    .from(books)
    .where(eq(books.id, bookId))
  if (!student || !book) {
    res.status(404).json({ error: 'Student or book not found.' })
    return
  }
  if (book.totalPages !== null && currentPage > book.totalPages) {
    res.status(400).json({ error: 'Current page cannot exceed the book’s total pages.' })
    return
  }
  const [assignment] = await db
    .insert(readingAssignments)
    .values({ studentId, bookId, currentPage, status })
    .onConflictDoNothing({ target: [readingAssignments.studentId, readingAssignments.bookId] })
    .returning()
  if (!assignment) {
    res.status(409).json({ error: 'This book is already assigned to this student.' })
    return
  }
  res.status(201).json(assignment)
})

assignmentsRouter.patch('/:id', async (req, res) => {
  const id = req.params.id
  const { currentPage, status } = req.body ?? {}
  if (!uuid(id) || !validProgress(currentPage, status)) {
    res
      .status(400)
      .json({ error: 'Enter a valid assignment ID, status, and non-negative whole page number.' })
    return
  }
  const [existing] = await db
    .select({ totalPages: books.totalPages })
    .from(readingAssignments)
    .innerJoin(books, eq(readingAssignments.bookId, books.id))
    .where(eq(readingAssignments.id, id))
  if (!existing) {
    res.status(404).json({ error: 'Reading assignment not found.' })
    return
  }
  if (existing.totalPages !== null && currentPage > existing.totalPages) {
    res.status(400).json({ error: 'Current page cannot exceed the book’s total pages.' })
    return
  }
  const [assignment] = await db
    .update(readingAssignments)
    .set({ currentPage, status })
    .where(
      and(
        eq(readingAssignments.id, id),
        sql`${currentPage} <= COALESCE((SELECT total_pages FROM books WHERE id = ${readingAssignments.bookId}), 2147483647)`,
      ),
    )
    .returning()
  if (!assignment) {
    res.status(409).json({ error: 'The assignment or book changed. Reload and try again.' })
    return
  }
  res.json(assignment)
})

assignmentsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id
  if (!uuid(id)) {
    res.status(400).json({ error: 'Invalid assignment ID.' })
    return
  }
  const [assignment] = await db
    .delete(readingAssignments)
    .where(eq(readingAssignments.id, id))
    .returning({ id: readingAssignments.id })
  if (!assignment) {
    res.status(404).json({ error: 'Reading assignment not found.' })
    return
  }
  res.status(204).end()
})
