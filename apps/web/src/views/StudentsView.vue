<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Classroom reading</p>
      <h1>Students</h1>
      <p>Add students and manage your classroom roster.</p>
    </div>
    <button class="button" :disabled="showForm" @click="openEditStudentForm()">Add students</button>
  </section>
  <EditStudent v-if="showForm" :key="selectedStudent?.id ?? 'new'" :student="selectedStudent" @saved="showForm = false"
    @cancel="showForm = false" />
  <section class="panel">
    <div class="table-top">
      <div>
        <h2>Student roster</h2>
        <p>Your students will appear here.</p>
      </div>
    </div>
    <p v-if="loading">Loading students…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button" @click="studentsStore.loadStudents()">Try again</button>
    </div>

    <div v-else-if="students.length === 0" class="empty">No students yet.</div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Year</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.name }}</td>
            <td>{{ student.year }}</td>
            <td>{{ new Date(student.createdAt).toLocaleDateString() }}</td>
            <td><button type="button" :disabled="showForm" :aria-label="`Edit ${student.name}`"
                @click="openEditStudentForm(student)">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStudentsStore } from '../stores/students'
import EditStudent from '../components/students/EditStudent.vue'
import type { Student } from '../types'

const studentsStore = useStudentsStore()
const { students, loading, error } = storeToRefs(studentsStore)
const showForm = ref(false)
const selectedStudent = ref<Student | undefined>()

function openEditStudentForm(student?: Student) {
  selectedStudent.value = student
  showForm.value = true
}

onMounted(() => {
  studentsStore.loadStudents()
})
</script>
