import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import type { Student } from '../types'

export const useStudentsStore = defineStore('students', () => {
  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadStudents() {
    loading.value = true
    error.value = null

    try {
      students.value = await api.get<Student[]>('/students')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not load students'
    } finally {
      loading.value = false
    }
  }

  async function addStudent(input: Pick<Student, 'name' | 'year'>) {
    const student = await api.post<Student>('/students', input)
    students.value.push(student)
    students.value.sort((a, b) => a.name.localeCompare(b.name))
    return student
  }

  async function updateStudent(id: string, input: Pick<Student, 'name' | 'year'>) {
    const student = await api.patch<Student>(`/students/${id}`, input)
    const index = students.value.findIndex((item) => item.id === id)
    if (index !== -1) students.value.splice(index, 1, student)
    students.value.sort((a, b) => a.name.localeCompare(b.name))
    return student
  }

  return { students, loading, error, loadStudents, addStudent, updateStudent }
})
