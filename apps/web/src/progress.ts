import type { Book, ReadingAssignment } from './types'

export const percent = (assignment: ReadingAssignment, book?: Book) =>
  book?.totalPages
    ? Math.min(100, Math.round((assignment.currentPage / book.totalPages) * 100))
    : undefined
