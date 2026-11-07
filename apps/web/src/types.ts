export type Status = 'not_started' | 'reading' | 'finished'
export interface Student {
  id: string
  name: string
  year: number
  createdAt: string
}
export interface Book {
  id: string
  title: string
  author: string
  totalPages?: number
  createdAt: string
}
export interface ReadingAssignment {
  id: string
  studentId: string
  bookId: string
  currentPage: number
  status: Status
  updatedAt: string
}
