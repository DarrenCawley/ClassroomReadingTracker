import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { DEMO_IDENTITY } from '../auth/demo'
import { listStudents } from './students'
import { listBooks } from './books'
import { listAssignments } from './assignments'

export const demoRouter = Router()

// Reject writes explicitly, including requests from signed-in teachers.
demoRouter.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.set('Allow', 'GET, HEAD').status(405).json({ error: 'The demo is read-only.' })
    return
  }
  next()
})

demoRouter.use(async (_req, res, next) => {
  const [owner] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.authProvider, DEMO_IDENTITY.provider),
        eq(users.authSubjectId, DEMO_IDENTITY.subject),
      ),
    )
    .limit(1)
  if (!owner) {
    res.status(503).json({ error: 'The demo is unavailable.' })
    return
  }
  res.locals.ownerUserId = owner.id
  next()
})

demoRouter.get('/students', async (_req, res) => {
  res.json(await listStudents(res.locals.ownerUserId))
})
demoRouter.get('/books', async (_req, res) => {
  res.json(await listBooks(res.locals.ownerUserId))
})
demoRouter.get('/assignments', async (_req, res) => {
  res.json(await listAssignments(res.locals.ownerUserId))
})
