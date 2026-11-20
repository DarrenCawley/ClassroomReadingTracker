import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import { PgDialect } from 'drizzle-orm/pg-core'

const teacherId = '11111111-1111-4111-8111-111111111111'
const recordId = '22222222-2222-4222-8222-222222222222'
const fake = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const name of [
    'from',
    'where',
    'limit',
    'orderBy',
    'innerJoin',
    'leftJoin',
    'values',
    'set',
    'returning',
    'onConflictDoNothing',
  ]) {
    chain[name] = vi.fn()
  }
  return { chain, query: vi.fn(), execute: vi.fn(), resolveUser: vi.fn() }
})
vi.mock('../../db/index', () => ({
  db: {
    select: fake.query,
    insert: fake.query,
    update: fake.query,
    delete: fake.query,
    execute: fake.execute,
  },
}))
vi.mock('../../auth/clerk', () => ({
  getAuthIdentity: (req: express.Request) =>
    req.headers.authorization ? { provider: 'clerk', subject: 'user_teacher' } : null,
}))
vi.mock('../../auth/users', () => ({ findOrCreateUser: fake.resolveUser }))

import { studentsRouter } from '../students'
import { booksRouter } from '../books'
import { assignmentsRouter } from '../assignments'
import { demoRouter } from '../demo'

let server: Server
let base: string
const dialect = new PgDialect()
const signedIn = { authorization: 'test-session', 'Content-Type': 'application/json' }

beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.use('/students', studentsRouter)
  app.use('/books', booksRouter)
  app.use('/assignments', assignmentsRouter)
  app.use('/demo', demoRouter)
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test server port')
  base = `http://127.0.0.1:${address.port}`
})
afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
)
beforeEach(() => {
  vi.clearAllMocks()
  fake.resolveUser.mockResolvedValue({ id: teacherId })
  fake.query.mockReturnValue(fake.chain)
  for (const [name, fn] of Object.entries(fake.chain)) {
    if (name !== 'then') fn.mockReturnValue(fake.chain)
  }
  // Empty result means no matching record belongs to the teacher.
  Object.assign(fake.chain, {
    then: (resolve: (rows: unknown[]) => unknown) => Promise.resolve([]).then(resolve),
  })
})

describe('teacher access boundaries', () => {
  it('rejects anonymous reads and writes on all private resources before querying data', async () => {
    for (const resource of ['students', 'books', 'assignments']) {
      for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
        const path = ['PATCH', 'DELETE'].includes(method) ? `${resource}/${recordId}` : resource
        const response = await fetch(`${base}/${path}`, { method })
        expect(response.status).toBe(401)
      }
    }
    expect(fake.query).not.toHaveBeenCalled()
    expect(fake.execute).not.toHaveBeenCalled()
    expect(fake.resolveUser).not.toHaveBeenCalled()
  })

  it('rejects demo writes even for signed-in visitors', async () => {
    for (const resource of ['students', 'books', 'assignments']) {
      for (const method of ['POST', 'PATCH', 'DELETE']) {
        const response = await fetch(`${base}/demo/${resource}/${recordId}`, {
          method,
          headers: signedIn,
        })
        expect(response.status).toBe(405)
      }
    }
    expect(fake.query).not.toHaveBeenCalled()
  })

  it('ignores a client-supplied student owner', async () => {
    const response = await fetch(`${base}/students`, {
      method: 'POST',
      headers: signedIn,
      body: JSON.stringify({ name: 'New student', year: 4, ownerUserId: recordId }),
    })
    expect(response.status).toBe(201)
    expect(fake.chain.values).toHaveBeenCalledWith({
      name: 'New student',
      year: 4,
      ownerUserId: teacherId,
    })
  })

  it('filters every private list by the verified teacher', async () => {
    for (const resource of ['students', 'books', 'assignments']) {
      fake.chain.where!.mockClear()
      const response = await fetch(`${base}/${resource}`, { headers: signedIn })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
      const query = dialect.sqlToQuery(fake.chain.where!.mock.calls[0]![0])
      expect(query.sql).toContain('owner_user_id')
      expect(query.params.every((value) => value === teacherId)).toBe(true)
      expect(query.params.length).toBeGreaterThan(0)
    }
  })

  it('reads only the demo owner records without requiring a login', async () => {
    fake.chain.limit!.mockResolvedValueOnce([{ id: recordId }])
    const response = await fetch(`${base}/demo/students`)
    expect(response.status).toBe(200)
    const conditions = fake.chain.where!.mock.calls.map(([condition]) =>
      dialect.sqlToQuery(condition),
    )
    expect(conditions[0]!.params).toEqual(['demo', 'public-demo'])
    expect(conditions[1]!.params).toEqual([recordId])
    expect(fake.resolveUser).not.toHaveBeenCalled()
  })

  it('restricts student edits to the verified teacher and returns 404 for other records', async () => {
    const response = await fetch(`${base}/students/${recordId}`, {
      method: 'PATCH',
      headers: signedIn,
      body: JSON.stringify({ name: 'Changed', year: 4 }),
    })
    expect(response.status).toBe(404)
    const query = dialect.sqlToQuery(fake.chain.where!.mock.calls[0]![0])
    expect(query.sql).toContain('"students"."owner_user_id"')
    expect(query.params).toEqual([recordId, teacherId])
  })

  it('checks ownership of both references before creating an assignment', async () => {
    const response = await fetch(`${base}/assignments`, {
      method: 'POST',
      headers: signedIn,
      body: JSON.stringify({ studentId: recordId, bookId: recordId }),
    })
    expect(response.status).toBe(404)
    expect(fake.chain.values).not.toHaveBeenCalled()
    const queries = fake.chain.where!.mock.calls.map(([condition]) => dialect.sqlToQuery(condition))
    expect(queries).toHaveLength(2)
    expect(queries[0]!.sql).toContain('"students"."owner_user_id"')
    expect(queries[1]!.sql).toContain('"books"."owner_user_id"')
    for (const query of queries) expect(query.params).toEqual([recordId, teacherId])
  })

  it('restricts assignment deletion to owned students and books', async () => {
    const response = await fetch(`${base}/assignments/${recordId}`, {
      method: 'DELETE',
      headers: signedIn,
    })
    expect(response.status).toBe(404)
    const query = dialect.sqlToQuery(fake.chain.where!.mock.calls[0]![0])
    expect(query.sql).toContain('students.owner_user_id')
    expect(query.sql).toContain('books.owner_user_id')
    expect(query.params).toEqual([recordId, teacherId, teacherId])
  })

  it('rejects edits to assignments outside the teacher account', async () => {
    const response = await fetch(`${base}/assignments/${recordId}`, {
      method: 'PATCH',
      headers: signedIn,
      body: JSON.stringify({ currentPage: 10, status: 'reading' }),
    })
    expect(response.status).toBe(404)
    expect(fake.chain.set).not.toHaveBeenCalled()
    const query = dialect.sqlToQuery(fake.chain.where!.mock.calls[0]![0])
    expect(query.params).toEqual([recordId, teacherId, teacherId])
  })

  it('restricts the atomic book update and its author creation to the teacher', async () => {
    fake.execute.mockResolvedValue({ rows: [] })
    const response = await fetch(`${base}/books/${recordId}`, {
      method: 'PATCH',
      headers: signedIn,
      body: JSON.stringify({ title: 'Changed', author: 'An author', totalPages: 100 }),
    })
    expect(response.status).toBe(404)
    const query = dialect.sqlToQuery(fake.execute.mock.calls[0]![0])
    expect(query.sql.match(/owner_user_id/g)).toHaveLength(2)
    expect(query.params.filter((value) => value === teacherId)).toHaveLength(2)
  })
})
