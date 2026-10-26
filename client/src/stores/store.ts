import { computed, reactive } from 'vue'
import { localRepository } from '../repository'
import type { Book, ReadingAssignment, Status, Student, TrackerData } from '../types'
const data = reactive<TrackerData>(localRepository.load())
const id = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
const now = () => new Date().toISOString()
const persist = () => localRepository.save(data)
export const percent = (assignment: ReadingAssignment, book?: Book) =>
  book?.totalPages
    ? Math.min(100, Math.round((assignment.currentPage / book.totalPages) * 100))
    : undefined
export const store = {
  students: computed(() => data.students),
  books: computed(() => data.books),
  assignments: computed(() => data.assignments),
  addStudent(name: string) {
    data.students.push({ id: id(), name: name.trim(), createdAt: now() })
    persist()
  },
  updateStudent(student: Student, name: string) {
    student.name = name.trim()
    persist()
  },
  removeStudent(studentId: string) {
    data.students.splice(
      data.students.findIndex((s) => s.id === studentId),
      1,
    )
    data.assignments = data.assignments.filter((a) => a.studentId !== studentId)
    persist()
  },
  addBook(input: Pick<Book, 'title' | 'author' | 'totalPages'>) {
    data.books.push({ ...input, id: id(), createdAt: now() })
    persist()
  },
  updateBook(book: Book, input: Pick<Book, 'title' | 'author' | 'totalPages'>) {
    Object.assign(book, input)
    data.assignments
      .filter((a) => a.bookId === book.id)
      .forEach((a) => this.updateAssignment(a, a.currentPage, a.status))
    persist()
  },
  removeBook(bookId: string) {
    data.books.splice(
      data.books.findIndex((b) => b.id === bookId),
      1,
    )
    data.assignments = data.assignments.filter((a) => a.bookId !== bookId)
    persist()
  },
  assign(studentId: string, bookId: string) {
    if (!data.assignments.some((a) => a.studentId === studentId && a.bookId === bookId)) {
      data.assignments.push({
        id: id(),
        studentId,
        bookId,
        currentPage: 0,
        status: 'not_started',
        updatedAt: now(),
      })
      persist()
    }
  },
  updateAssignment(a: ReadingAssignment, page: number, status: Status) {
    const book = data.books.find((b) => b.id === a.bookId)
    a.currentPage = Math.max(0, book?.totalPages ? Math.min(page, book.totalPages) : page)
    a.status = status
    a.updatedAt = now()
    persist()
  },
  removeAssignment(id: string) {
    data.assignments.splice(
      data.assignments.findIndex((a) => a.id === id),
      1,
    )
    persist()
  },
}
