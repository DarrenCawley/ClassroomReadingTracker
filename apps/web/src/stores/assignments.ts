import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import type { ReadingAssignment } from '../types'

export const useAssignmentsStore = defineStore('assignments', () => {
  const assignments = ref<ReadingAssignment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  async function loadAssignments() {
    loading.value = true
    error.value = null
    try {
      assignments.value = await api.get<ReadingAssignment[]>('/assignments')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not load reading assignments'
    } finally {
      loading.value = false
    }
  }
  async function addAssignment(
    input: Pick<ReadingAssignment, 'studentId' | 'bookId' | 'currentPage' | 'status'>,
  ) {
    const assignment = await api.post<ReadingAssignment>('/assignments', input)
    assignments.value.push(assignment)
    return assignment
  }
  async function updateAssignment(
    id: string,
    input: Pick<ReadingAssignment, 'currentPage' | 'status'>,
  ) {
    const assignment = await api.patch<ReadingAssignment>(`/assignments/${id}`, input)
    const index = assignments.value.findIndex((item) => item.id === id)
    if (index !== -1) assignments.value.splice(index, 1, assignment)
    return assignment
  }
  async function removeAssignment(id: string) {
    await api.delete(`/assignments/${id}`)
    assignments.value = assignments.value.filter((item) => item.id !== id)
  }
  return {
    assignments,
    loading,
    error,
    loadAssignments,
    addAssignment,
    updateAssignment,
    removeAssignment,
  }
})
