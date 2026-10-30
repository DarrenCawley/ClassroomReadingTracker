<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import { useStudentsStore } from '../../stores/students'
import type { Student } from '../../types'

const props = defineProps<{ student?: Student }>()
const emit = defineEmits<{ saved: [student: Student]; cancel: [] }>()
const studentsStore = useStudentsStore()
const inputId = useId()
// Edit a copy so cancelling never changes the roster.
const name = ref(props.student?.name ?? '')
const year = ref<number | ''>(props.student?.year ?? '')
const saving = ref(false)
const error = ref<string | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

onMounted(() => nameInput.value?.focus())

async function save() {
  if (saving.value) return
  error.value = null
  if (!name.value.trim() || typeof year.value !== 'number' || !Number.isInteger(year.value) || year.value < 0 || year.value > 2147483647) {
    error.value = 'Enter a name and a valid non-negative whole number for year.'
    return
  }
  saving.value = true
  try {
    const input = { name: name.value.trim(), year: year.value }
    const student = props.student
      ? await studentsStore.updateStudent(props.student.id, input)
      : await studentsStore.addStudent(input)
    emit('saved', student)
  } catch {
    error.value = 'Could not save the student. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="panel">
    <h2>{{ student ? 'Edit student' : 'Add student' }}</h2>
    <form class="form" @submit.prevent="save">
      <label :for="`${inputId}-name`">Name</label>
      <input :id="`${inputId}-name`" ref="nameInput" v-model="name" required :disabled="saving" autocomplete="off" />
      <label :for="`${inputId}-year`">Year</label>
      <input :id="`${inputId}-year`" v-model.number="year" type="number" min="0" max="2147483647" step="1" required
        :disabled="saving" />
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="student-form-actions">
        <button class="button" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save student' }}</button>
        <button type="button" :disabled="saving" @click="emit('cancel')">Cancel</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.student-form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
