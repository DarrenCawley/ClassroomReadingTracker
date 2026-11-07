// Exercise the Express handlers without a live server or database.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

const db = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))
vi.mock('../../../../api/src/db/index', () => ({ db }))
import { assignmentsRouter } from '../../../../api/src/routes/assignments'

const studentId = '00000000-0000-4000-8000-000000000001'
const bookId = '00000000-0000-4000-8000-000000000002'
const id = '00000000-0000-4000-8000-000000000003'
const assignment = { id, studentId, bookId, currentPage: 12, status: 'reading' }

async function call(method: string, path: string, body: unknown = {}, params = {}) {
  const layer = assignmentsRouter.stack.find(
    (layer) =>
      layer.route?.path === path &&
      layer.route.stack.some((entry: { method?: string }) => entry.method === method),
  )!
  const handler = layer.route!.stack[0]!.handle
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), end: vi.fn() }
  await handler({ body, params } as Request, res as unknown as Response, vi.fn())
  return res
}

function selectResult(rows: unknown[]) {
  const query = {
    where: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockResolvedValue(rows),
    innerJoin: vi.fn(),
  }
  query.innerJoin.mockReturnValue(query)
  db.select.mockReturnValueOnce({ from: vi.fn().mockReturnValue(query) })
}

beforeEach(() => vi.resetAllMocks())

describe('Reading assignment API', () => {
  it('lists database assignments', async () => {
    selectResult([assignment])
    const res = await call('get', '/')
    expect(res.json).toHaveBeenCalledWith([assignment])
  })

  it.each([-1, 1.5, 2147483648, '12'])(
    'rejects invalid current page %s without writing',
    async (page) => {
      const res = await call('post', '/', {
        studentId,
        bookId,
        currentPage: page,
        status: 'reading',
      })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(db.insert).not.toHaveBeenCalled()
    },
  )

  it('rejects invalid statuses and IDs', async () => {
    const res = await call('patch', '/:id', { currentPage: 0, status: 'invalid' }, { id })
    expect(res.status).toHaveBeenCalledWith(400)
    const invalidId = await call('delete', '/:id', {}, { id: 'not-a-uuid' })
    expect(invalidId.status).toHaveBeenCalledWith(400)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('rejects pages beyond the book length', async () => {
    selectResult([{ id: studentId }])
    selectResult([{ totalPages: 10 }])
    const res = await call('post', '/', { studentId, bookId, currentPage: 11, status: 'reading' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('returns 404 for missing students or books', async () => {
    selectResult([])
    selectResult([{ totalPages: 10 }])
    const res = await call('post', '/', { studentId, bookId })
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('creates assignments with defaults and reports duplicates', async () => {
    const values = vi
      .fn()
      .mockReturnValue({
        onConflictDoNothing: vi
          .fn()
          .mockReturnValue({ returning: vi.fn().mockResolvedValue([assignment]) }),
      })
    db.insert.mockReturnValue({ values })
    selectResult([{ id: studentId }])
    selectResult([{ totalPages: 120 }])
    const res = await call('post', '/', { studentId, bookId })
    expect(values).toHaveBeenCalledWith({
      studentId,
      bookId,
      currentPage: 0,
      status: 'not_started',
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(assignment)

    db.insert.mockReturnValue({
      values: vi
        .fn()
        .mockReturnValue({
          onConflictDoNothing: vi
            .fn()
            .mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
        }),
    })
    selectResult([{ id: studentId }])
    selectResult([{ totalPages: null }])
    const duplicate = await call('post', '/', { studentId, bookId })
    expect(duplicate.status).toHaveBeenCalledWith(409)
  })

  it('updates progress and deletes an assignment', async () => {
    selectResult([{ totalPages: 120 }])
    const set = vi
      .fn()
      .mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([assignment]) }),
      })
    db.update.mockReturnValue({ set })
    const updated = await call('patch', '/:id', { currentPage: 12, status: 'reading' }, { id })
    expect(set).toHaveBeenCalledWith({ currentPage: 12, status: 'reading' })
    expect(updated.json).toHaveBeenCalledWith(assignment)
    db.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id }]) }),
    })
    const removed = await call('delete', '/:id', {}, { id })
    expect(removed.status).toHaveBeenCalledWith(204)
  })
})
