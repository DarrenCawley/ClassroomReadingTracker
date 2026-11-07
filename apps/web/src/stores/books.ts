import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import type { Book } from '../types'

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  async function loadBooks() {
    loading.value = true
    error.value = null
    try {
      books.value = await api.get<Book[]>('/books')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not load books'
    } finally {
      loading.value = false
    }
  }
  async function saveBook(input: Pick<Book, 'title' | 'author' | 'totalPages'>, id?: string) {
    const book = id
      ? await api.patch<Book>(`/books/${id}`, input)
      : await api.post<Book>('/books', input)
    const index = books.value.findIndex((item) => item.id === book.id)
    if (index === -1) books.value.push(book)
    else books.value.splice(index, 1, book)
    books.value.sort((a, b) => a.title.localeCompare(b.title))
    return book
  }
  return { books, loading, error, loadBooks, saveBook }
})
