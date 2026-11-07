<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useAssignmentsStore } from '../../stores/assignments'
import type { Book, ReadingAssignment, Status, Student } from '../../types'

const props = defineProps<{
  assignment?: ReadingAssignment
  studentId?: string
  students: Student[]
  books: Book[]
}>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const store = useAssignmentsStore()
const inputId = useId()
const studentId = ref(props.assignment?.studentId ?? props.studentId ?? '')
const bookId = ref(props.assignment?.bookId ?? '')
const currentPage = ref<number | ''>(props.assignment?.currentPage ?? 0)
const status = ref<Status>(props.assignment?.status ?? 'not_started')
const saving = ref(false)
const error = ref('')
const book = computed(() => props.books.find((item) => item.id === bookId.value))
const availableBooks = computed(() =>
  props.books.filter(
    (book) =>
      !store.assignments.some(
        (a) =>
          a.studentId === studentId.value && a.bookId === book.id && a.id !== props.assignment?.id,
      ),
  ),
)

async function save() {
  if (saving.value) return
  error.value = ''
  if (
    !studentId.value ||
    !bookId.value ||
    typeof currentPage.value !== 'number' ||
    !Number.isInteger(currentPage.value) ||
    currentPage.value < 0 ||
    currentPage.value > (book.value?.totalPages ?? 2147483647)
  ) {
    error.value =
      'Choose a student and book, and enter a whole page number within the book’s length.'
    return
  }
  saving.value = true
  try {
    const progress = { currentPage: currentPage.value, status: status.value }
    if (props.assignment) await store.updateAssignment(props.assignment.id, progress)
    else
      await store.addAssignment({ studentId: studentId.value, bookId: bookId.value, ...progress })
    emit('saved')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save the assignment.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="panel editor">
    <h2>{{ assignment ? 'Update reading progress' : 'Assign a book' }}</h2>
    <form class="form" @submit.prevent="save">
      <label :for="`${inputId}-student`">Student</label>
      <select
        :id="`${inputId}-student`"
        v-model="studentId"
        required
        :disabled="saving || !!assignment || !!props.studentId"
        @change="bookId = ''"
      >
        <option disabled value="">Choose a student</option>
        <option v-for="student in students" :key="student.id" :value="student.id">
          {{ student.name }}
        </option>
      </select>
      <label :for="`${inputId}-book`">Book</label>
      <select
        :id="`${inputId}-book`"
        v-model="bookId"
        required
        :disabled="saving || !!assignment || !studentId"
      >
        <option disabled value="">Choose a book</option>
        <option v-for="item in availableBooks" :key="item.id" :value="item.id">
          {{ item.title }} — {{ item.author }}
        </option>
      </select>
      <p v-if="studentId && !availableBooks.length">
        All books are already assigned to this student.
      </p>
      <label :for="`${inputId}-page`"
        >Current page{{ book?.totalPages ? ` (of ${book.totalPages})` : '' }}</label
      >
      <input
        :id="`${inputId}-page`"
        v-model.number="currentPage"
        type="number"
        min="0"
        :max="book?.totalPages ?? 2147483647"
        step="1"
        required
        :disabled="saving"
      />
      <label :for="`${inputId}-status`">Status</label>
      <select :id="`${inputId}-status`" v-model="status" :disabled="saving">
        <option value="not_started">Not started</option>
        <option value="reading">Reading</option>
        <option value="finished">Finished</option>
      </select>
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="button" type="submit" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save assignment' }}
        </button>
        <button type="button" :disabled="saving" @click="emit('cancel')">Cancel</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.editor {
  margin-bottom: 24px;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
