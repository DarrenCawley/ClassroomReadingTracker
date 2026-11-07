import type { TrackerData } from './types'

type LocalData = Omit<TrackerData, 'books'>

export interface TrackerRepository {
  load(): LocalData
  save(data: LocalData): void
}
export const emptyData = (): LocalData => ({ students: [], assignments: [] })
const demo: LocalData = {
  students: [
    { id: 's1', name: 'Ava Thompson', year: 7, createdAt: '2026-08-01' },
    { id: 's2', name: 'Marcus Lee', year: 8, createdAt: '2026-08-01' },
    { id: 's3', name: 'Sofia Rivera', year: 2, createdAt: '2026-08-01' },
  ],
  assignments: [
    {
      id: 'a1',
      studentId: 's1',
      bookId: 'b1',
      currentPage: 96,
      status: 'reading',
      updatedAt: '2026-08-14',
    },
    {
      id: 'a2',
      studentId: 's2',
      bookId: 'b2',
      currentPage: 288,
      status: 'finished',
      updatedAt: '2026-08-15',
    },
    {
      id: 'a3',
      studentId: 's3',
      bookId: 'b3',
      currentPage: 24,
      status: 'reading',
      updatedAt: '2026-08-16',
    },
  ],
}
const KEY = 'book-tracker-data-v1'
const copyDemo = (): LocalData => JSON.parse(JSON.stringify(demo))
export const localRepository: TrackerRepository = {
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return copyDemo()
      const stored = JSON.parse(raw) as LocalData
      return { students: stored.students, assignments: stored.assignments }
    } catch {
      return copyDemo()
    }
  },
  save(data) {
    localStorage.setItem(
      KEY,
      JSON.stringify({ students: data.students, assignments: data.assignments }),
    )
  },
}
