import { ref, watch, type Ref } from 'vue'
import { api } from '../api'
import { sessionKey, sessionRevision } from '../auth/session'

export function useCollection<T>(path: string, fallbackError: string) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  watch(
    sessionKey,
    () => {
      requestId++
      items.value = []
      loading.value = false
      error.value = null
    },
    { flush: 'sync' },
  )

  async function load() {
    const id = ++requestId
    const revision = sessionRevision()
    const current = () => id === requestId && revision === sessionRevision()
    loading.value = true
    error.value = null
    try {
      const results = await api.get<T[]>(path)
      if (current()) items.value = results
    } catch (err) {
      if (current()) error.value = err instanceof Error ? err.message : fallbackError
    } finally {
      if (current()) loading.value = false
    }
  }
  return { items, loading, error, load }
}
