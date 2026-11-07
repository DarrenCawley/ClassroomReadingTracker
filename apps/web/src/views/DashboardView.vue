<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Classroom reading</p>
      <h1>Dashboard</h1>
      <p>Keep a clear view of every reader’s journey.</p>
    </div>
    <RouterLink class="button" to="/students">Manage students</RouterLink>
  </section>
  <div v-if="error" role="alert" class="panel">
    <p>{{ error }}</p>
    <button class="button" @click="studentsStore.loadStudents()">Retry loading students</button>
  </div>
  <div v-if="booksError" role="alert" class="panel">
    <p>{{ booksError }}</p>
    <button class="button" @click="booksStore.loadBooks()">Retry loading books</button>
  </div>
  <div v-if="assignmentsError" role="alert" class="panel">
    <p>{{ assignmentsError }}</p>
    <button class="button" @click="assignmentsStore.loadAssignments()">
      Retry loading assignments
    </button>
  </div>
  <section class="stats">
    <article
      role="link"
      tabindex="0"
      style="cursor: pointer"
      @click="router.push({ name: 'students' })"
      @keydown.enter="router.push({ name: 'students' })"
    >
      <small>Students</small><strong>{{ loading ? '...' : students.length }}</strong>
    </article>
    <article
      role="link"
      tabindex="0"
      style="cursor: pointer"
      @click="router.push({ name: 'books' })"
      @keydown.enter="router.push({ name: 'books' })"
    >
      <small>Books</small><strong>{{ booksLoading ? '...' : books.length }}</strong>
    </article>
    <article>
      <small>Actively reading</small><strong>{{ assignmentsLoading ? '...' : active }}</strong>
    </article>
    <article>
      <small>Completed</small><strong>{{ assignmentsLoading ? '...' : finished }}</strong>
    </article>
  </section>
  <section class="panel">
    <div class="table-top">
      <div>
        <h2>Reading progress</h2>
        <p>Assigned books across your classroom.</p>
        <RouterLink to="/assignments">Manage assignments</RouterLink>
      </div>
      <input
        v-model="filter"
        aria-label="Filter reading progress"
        placeholder="Search student or book"
      />
    </div>
    <p v-if="progressLoading" role="status">Loading reading progress?</p>
    <p v-else-if="error || booksError || assignmentsError">
      Reading progress is unavailable. Retry loading above.
    </p>
    <div v-else-if="rows.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Book</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.a.id">
            <td>
              <RouterLink :to="`/students/${row.student?.id}`">{{ row.student?.name }}</RouterLink>
            </td>
            <td>
              <strong>{{ row.book?.title }}</strong
              ><small>{{ row.book?.author }}</small>
            </td>
            <td>
              <template v-if="row.book?.totalPages">
                <div class="bar"><i :style="{ width: `${percent(row.a, row.book)}%` }" /></div>
                {{ row.a.currentPage }} / {{ row.book.totalPages }} ·
                {{ percent(row.a, row.book) }}% </template
              ><template v-else>{{ row.a.currentPage }} pages</template>
            </td>
            <td>
              <span class="badge" :class="row.a.status">{{
                row.a.status.replaceAll('_', ' ')
              }}</span>
            </td>
            <td>{{ new Date(row.a.updatedAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">No reading records match that search.</div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { percent } from '../progress'
import { useAssignmentsStore } from '../stores/assignments'
import { storeToRefs } from 'pinia'
import { useStudentsStore } from '../stores/students'
import { useBooksStore } from '../stores/books'

const router = useRouter()
const filter = ref('')

const assignmentsStore = useAssignmentsStore()
const {
  assignments,
  loading: assignmentsLoading,
  error: assignmentsError,
} = storeToRefs(assignmentsStore)
const progressLoading = computed(
  () => loading.value || booksLoading.value || assignmentsLoading.value,
)
const booksStore = useBooksStore()
const { books, loading: booksLoading, error: booksError } = storeToRefs(booksStore)
const studentsStore = useStudentsStore()
const { students, loading, error } = storeToRefs(studentsStore)

onMounted(() => {
  studentsStore.loadStudents()
  booksStore.loadBooks()
  assignmentsStore.loadAssignments()
})

const rows = computed(() =>
  assignments.value
    .map((a) => ({
      a,
      student: students.value.find((s) => s.id === a.studentId),
      book: books.value.find((b) => b.id === a.bookId),
    }))
    .filter((r) => r.student && r.book)
    .filter((r) =>
      `${r.student?.name} ${r.book?.title}`.toLowerCase().includes(filter.value.toLowerCase()),
    ),
)
const active = computed(() => assignments.value.filter((a) => a.status === 'reading').length)
const finished = computed(() => assignments.value.filter((a) => a.status === 'finished').length)
</script>
