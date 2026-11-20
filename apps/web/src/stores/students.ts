import { defineStore } from 'pinia'
import { api } from '../api'
import type { Student } from '../types'
import { useCollection } from './collection'
import { assertCurrentSession, sessionRevision } from '../auth/session'

export const useStudentsStore = defineStore('students', () => {
  const {
    items: students,
    loading,
    error,
    load: loadStudents,
  } = useCollection<Student>('/students', 'Could not load students')

  async function addStudent(input: Pick<Student, 'name' | 'year'>) {
    const revision = sessionRevision()
    const student = await api.post<Student>('/students', input)
    assertCurrentSession(revision)
    students.value.push(student)
    students.value.sort((a, b) => a.name.localeCompare(b.name))
    return student
  }

  async function updateStudent(id: string, input: Pick<Student, 'name' | 'year'>) {
    const revision = sessionRevision()
    const student = await api.patch<Student>(`/students/${id}`, input)
    assertCurrentSession(revision)
    const index = students.value.findIndex((item) => item.id === id)
    if (index !== -1) students.value.splice(index, 1, student)
    students.value.sort((a, b) => a.name.localeCompare(b.name))
    return student
  }

  return { students, loading, error, loadStudents, addStudent, updateStudent }
})
