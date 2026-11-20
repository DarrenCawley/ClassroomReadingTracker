import { defineStore } from 'pinia'
import { api } from '../api'
import type { ReadingAssignment } from '../types'
import { useCollection } from './collection'
import { assertCurrentSession, sessionRevision } from '../auth/session'

export const useAssignmentsStore = defineStore('assignments', () => {
  const {
    items: assignments,
    loading,
    error,
    load: loadAssignments,
  } = useCollection<ReadingAssignment>('/assignments', 'Could not load reading assignments')
  async function addAssignment(
    input: Pick<ReadingAssignment, 'studentId' | 'bookId' | 'currentPage' | 'status'>,
  ) {
    const revision = sessionRevision()
    const assignment = await api.post<ReadingAssignment>('/assignments', input)
    assertCurrentSession(revision)
    assignments.value.push(assignment)
    return assignment
  }
  async function updateAssignment(
    id: string,
    input: Pick<ReadingAssignment, 'currentPage' | 'status'>,
  ) {
    const revision = sessionRevision()
    const assignment = await api.patch<ReadingAssignment>(`/assignments/${id}`, input)
    assertCurrentSession(revision)
    const index = assignments.value.findIndex((item) => item.id === id)
    if (index !== -1) assignments.value.splice(index, 1, assignment)
    return assignment
  }
  async function removeAssignment(id: string) {
    const revision = sessionRevision()
    await api.delete(`/assignments/${id}`)
    assertCurrentSession(revision)
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
