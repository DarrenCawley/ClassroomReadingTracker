import { defineStore } from 'pinia'
import { api } from '../api'
import type { Book } from '../types'
import { useCollection } from './collection'
import { assertCurrentSession, sessionRevision } from '../auth/session'

export const useBooksStore = defineStore('books', () => {
  const {
    items: books,
    loading,
    error,
    load: loadBooks,
  } = useCollection<Book>('/books', 'Could not load books')
  async function saveBook(input: Pick<Book, 'title' | 'author' | 'totalPages'>, id?: string) {
    const revision = sessionRevision()
    const book = id
      ? await api.patch<Book>(`/books/${id}`, input)
      : await api.post<Book>('/books', input)
    assertCurrentSession(revision)
    const index = books.value.findIndex((item) => item.id === book.id)
    if (index === -1) books.value.push(book)
    else books.value.splice(index, 1, book)
    books.value.sort((a, b) => a.title.localeCompare(b.title))
    return book
  }
  return { books, loading, error, loadBooks, saveBook }
})
