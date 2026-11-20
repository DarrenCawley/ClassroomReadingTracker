import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/index'
import { students } from '../db/schema'
import { requireTeacher } from '../auth/teacher'

export const studentsRouter = Router()
studentsRouter.use(requireTeacher)

studentsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid student ID.' })
    return
  }
  const { name, year } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Student name is required.' })
    return
  }
  if (typeof year !== 'number' || !Number.isInteger(year) || year < 0 || year > 2147483647) {
    res.status(400).json({ error: 'Year must be a non-negative whole number.' })
    return
  }
  try {
    const [student] = await db
      .update(students)
      .set({ name: name.trim(), year })
      .where(and(eq(students.id, id), eq(students.ownerUserId, res.locals.ownerUserId)))
      .returning()
    if (!student) {
      res.status(404).json({ error: 'Student not found.' })
      return
    }
    res.json(student)
  } catch {
    res.status(500).json({ error: 'Could not save the student. Please try again.' })
  }
})

studentsRouter.post('/', async (req, res) => {
  const { name, year } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Student name is required.' })
    return
  }
  if (typeof year !== 'number' || !Number.isInteger(year) || year < 0 || year > 2147483647) {
    res.status(400).json({ error: 'Year must be a non-negative whole number.' })
    return
  }
  try {
    const [student] = await db
      .insert(students)
      .values({
        name: name.trim(),
        year,
        ownerUserId: res.locals.ownerUserId,
      })
      .returning()
    res.status(201).json(student)
  } catch {
    res.status(500).json({ error: 'Could not save the student. Please try again.' })
  }
})

export async function listStudents(ownerUserId: string) {
  return db
    .select()
    .from(students)
    .where(eq(students.ownerUserId, ownerUserId))
    .orderBy(students.name)
}

studentsRouter.get('/', async (_req, res) => {
  res.json(await listStudents(res.locals.ownerUserId))
})
