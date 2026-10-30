import type { TrackerData } from './types'

export interface TrackerRepository { load(): TrackerData; save(data: TrackerData): void }
export const emptyData = (): TrackerData => ({ students: [], books: [], assignments: [] })
const demo: TrackerData = {
  students: [{ id: 's1', name: 'Ava Thompson', createdAt: '2026-08-01' }, { id: 's2', name: 'Marcus Lee', createdAt: '2026-08-01' }, { id: 's3', name: 'Sofia Rivera', createdAt: '2026-08-01' }],
  books: [{ id: 'b1', title: 'Charlotte’s Web', author: 'E. B. White', totalPages: 192, createdAt: '2026-08-01' }, { id: 'b2', title: 'The Wild Robot', author: 'Peter Brown', totalPages: 288, createdAt: '2026-08-01' }, { id: 'b3', title: 'Because of Winn-Dixie', author: 'Kate DiCamillo', totalPages: 288, createdAt: '2026-08-01' }],
  assignments: [{ id: 'a1', studentId: 's1', bookId: 'b1', currentPage: 96, status: 'reading', updatedAt: '2026-08-14' }, { id: 'a2', studentId: 's2', bookId: 'b2', currentPage: 288, status: 'finished', updatedAt: '2026-08-15' }, { id: 'a3', studentId: 's3', bookId: 'b3', currentPage: 24, status: 'reading', updatedAt: '2026-08-16' }]
}
const KEY = 'book-tracker-data-v1'
const copyDemo = (): TrackerData => JSON.parse(JSON.stringify(demo))
export const localRepository: TrackerRepository = {
  load() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : copyDemo() } catch { return copyDemo() } },
  save(data) { localStorage.setItem(KEY, JSON.stringify(data)) }
}
