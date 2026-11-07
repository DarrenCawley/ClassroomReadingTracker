<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBooksStore } from '../stores/books'
import EditBook from '../components/books/EditBook.vue'
import type { Book } from '../types'

const store = useBooksStore()
const { books, loading, error } = storeToRefs(store)
const showForm = ref(false)
const selected = ref<Book>()
const search = ref('')
const filtered = computed(() =>
  books.value.filter((book) =>
    `${book.title} ${book.author}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
function edit(book?: Book) {
  selected.value = book
  showForm.value = true
}
onMounted(() => store.loadBooks())
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Classroom reading</p>
      <h1>Books</h1>
      <p>Build and manage your classroom library.</p>
    </div>
    <button class="button" :disabled="showForm || loading" @click="edit()">Add book</button>
  </section>
  <EditBook
    v-if="showForm"
    :key="selected?.id ?? 'new'"
    :book="selected"
    @saved="showForm = false"
    @cancel="showForm = false"
  />
  <section class="panel">
    <div class="table-top">
      <div>
        <h2>Book library</h2>
        <p>Your classroom's books and authors.</p>
      </div>
      <input
        v-model="search"
        aria-label="Search books"
        placeholder="Search title or author"
        type="search"
      />
    </div>
    <p v-if="loading" role="status">Loading books…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button" @click="store.loadBooks()">Try again</button>
    </div>
    <div v-else-if="!books.length" class="empty">
      No books yet. Add your first book to get started.
    </div>
    <div v-else-if="!filtered.length" class="empty">No books match that search.</div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Pages</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filtered" :key="book.id">
            <td>{{ book.title }}</td>
            <td>{{ book.author }}</td>
            <td>{{ book.totalPages ?? 'Unknown' }}</td>
            <td>{{ new Date(book.createdAt).toLocaleDateString() }}</td>
            <td>
              <button :disabled="showForm" :aria-label="`Edit ${book.title}`" @click="edit(book)">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
