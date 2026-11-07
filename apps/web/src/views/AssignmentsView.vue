<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAssignmentsStore } from '../stores/assignments'
import { useStudentsStore } from '../stores/students'
import { useBooksStore } from '../stores/books'
import EditAssignment from '../components/assignments/EditAssignment.vue'
import { percent } from '../progress'
import type { ReadingAssignment } from '../types'

const route = useRoute()
const store = useAssignmentsStore()
const studentsStore = useStudentsStore()
const booksStore = useBooksStore()
const { assignments } = storeToRefs(store)
const { students } = storeToRefs(studentsStore)
const { books } = storeToRefs(booksStore)
const studentId = computed(() =>
  typeof route.params.studentId === 'string' ? route.params.studentId : undefined,
)
const student = computed(() => students.value.find((item) => item.id === studentId.value))
const loading = computed(() => store.loading || studentsStore.loading || booksStore.loading)
const loadError = computed(() => store.error || studentsStore.error || booksStore.error)
const search = ref('')
const statusFilter = ref('')
const showForm = ref(false)
const selected = ref<ReadingAssignment>()
const removing = ref<string | null>(null)
const confirming = ref<string | null>(null)
const actionError = ref('')
const rows = computed(() =>
  assignments.value
    .filter((a) => !studentId.value || a.studentId === studentId.value)
    .map((a) => ({
      a,
      student: students.value.find((s) => s.id === a.studentId),
      book: books.value.find((b) => b.id === a.bookId),
    }))
    .filter(
      (row) =>
        (!statusFilter.value || row.a.status === statusFilter.value) &&
        `${row.student?.name ?? ''} ${row.book?.title ?? ''}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    ),
)
async function load() {
  await Promise.all([store.loadAssignments(), studentsStore.loadStudents(), booksStore.loadBooks()])
}
function edit(assignment?: ReadingAssignment) {
  selected.value = assignment
  showForm.value = true
  confirming.value = null
  actionError.value = ''
}
async function remove(id: string) {
  if (removing.value) return
  removing.value = id
  actionError.value = ''
  try {
    await store.removeAssignment(id)
    confirming.value = null
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not remove the assignment.'
  } finally {
    removing.value = null
  }
}
watch(studentId, () => {
  showForm.value = false
  confirming.value = null
  search.value = ''
  actionError.value = ''
})
onMounted(load)
</script>

<template>
  <RouterLink v-if="studentId" class="back" to="/students">← All students</RouterLink>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Classroom reading</p>
      <h1>{{ studentId ? (student?.name ?? 'Student reading') : 'Reading assignments' }}</h1>
      <p>Assign books and keep reading progress up to date.</p>
    </div>
    <button
      class="button"
      :disabled="
        showForm ||
        loading ||
        !!loadError ||
        !students.length ||
        !books.length ||
        (!!studentId && !student)
      "
      @click="edit()"
    >
      Assign book
    </button>
  </section>
  <p v-if="loading" role="status">Loading reading assignments…</p>
  <section v-else-if="loadError" class="panel" role="alert">
    <p>{{ loadError }}</p>
    <button class="button" @click="load">Try again</button>
  </section>
  <section v-else-if="studentId && !student" class="panel empty">Student not found.</section>
  <template v-else>
    <EditAssignment
      v-if="showForm"
      :key="selected?.id ?? 'new'"
      :assignment="selected"
      :student-id="studentId"
      :students="students"
      :books="books"
      @saved="showForm = false"
      @cancel="showForm = false"
    />
    <section class="panel">
      <div class="table-top">
        <div>
          <h2>Reading progress</h2>
          <p>Books assigned to {{ studentId ? 'this student' : 'your classroom' }}.</p>
        </div>
        <input
          v-model="search"
          type="search"
          aria-label="Search reading assignments"
          placeholder="Search student or book"
        />
        <select v-model="statusFilter" aria-label="Filter by reading status">
          <option value="">All statuses</option>
          <option value="not_started">Not started</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>
      </div>
      <p v-if="actionError" role="alert">{{ actionError }}</p>
      <div v-if="!students.length || !books.length" class="empty">
        Add <RouterLink to="/students">students</RouterLink> and
        <RouterLink to="/books">books</RouterLink> to start assigning reading.
      </div>
      <div v-else-if="!rows.length" class="empty">
        No reading assignments match. Assign a book or change your filters.
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Book</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.a.id">
              <td>
                <RouterLink :to="`/students/${row.a.studentId}`">{{
                  row.student?.name ?? 'Unknown student'
                }}</RouterLink>
              </td>
              <td>
                <strong>{{ row.book?.title ?? 'Unknown book' }}</strong
                ><small>{{ row.book?.author }}</small>
              </td>
              <td>
                <template v-if="row.book?.totalPages"
                  ><div class="bar"><i :style="{ width: `${percent(row.a, row.book)}%` }" /></div>
                  {{ row.a.currentPage }} / {{ row.book.totalPages }} ·
                  {{ percent(row.a, row.book) }}%</template
                ><template v-else>{{ row.a.currentPage }} pages</template>
              </td>
              <td>
                <span class="badge" :class="row.a.status">{{
                  row.a.status.replaceAll('_', ' ')
                }}</span>
              </td>
              <td>{{ new Date(row.a.updatedAt).toLocaleDateString() }}</td>
              <td>
                <div v-if="confirming === row.a.id" class="actions">
                  <span>Remove assignment?</span
                  ><button :disabled="!!removing" @click="remove(row.a.id)">
                    {{ removing === row.a.id ? 'Removing…' : 'Confirm remove' }}</button
                  ><button :disabled="!!removing" @click="confirming = null">Cancel</button>
                </div>
                <div v-else class="actions">
                  <button
                    :disabled="showForm || !!removing"
                    :aria-label="`Update ${row.student?.name}: ${row.book?.title}`"
                    @click="edit(row.a)"
                  >
                    Update progress</button
                  ><button
                    class="danger"
                    :disabled="showForm || !!removing"
                    :aria-label="`Remove ${row.student?.name}: ${row.book?.title}`"
                    @click="confirming = row.a.id"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
</template>

<style scoped>
.table-top select {
  max-width: 180px;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
