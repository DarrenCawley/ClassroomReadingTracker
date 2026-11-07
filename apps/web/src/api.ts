import { computed, reactive, ref } from 'vue'

const BASE_URL = '/api'
// Track each data request separately, but share server health across all of them.
const pending = reactive(new Map<symbol, 'loading' | 'slow'>())
const healthDelayed = ref(false)
export const apiSlow = computed(() => [...pending.values()].some((state) => state !== 'loading'))
export const apiWaking = computed(() => apiSlow.value && healthDelayed.value)

interface HealthCheck {
  controller: AbortController
  delay: ReturnType<typeof setTimeout>
}
let sharedHealth: HealthCheck | undefined

function checkServerHealth() {
  // Keep the check (even after it settles) until all data requests finish.
  // Later slow requests reuse its result instead of probing the same server again.
  if (sharedHealth) return

  const controller = new AbortController()
  const check: HealthCheck = {
    controller,
    delay: setTimeout(() => {
      if (sharedHealth === check) healthDelayed.value = true
    }, 2000),
  }
  sharedHealth = check

  // Run only in response to slow data requests; do not poll an idle server.
  void fetch(`${BASE_URL}/health`, { signal: controller.signal, cache: 'no-store' })
    .catch(() => {
      // A network failure does not prove that Render is waking up.
    })
    .finally(() => {
      clearTimeout(check.delay)
      // A cancelled check can finish after a new group of requests has started.
      // Only update the banner if this is still the current shared check.
      if (sharedHealth === check) healthDelayed.value = false
    })
}

function resetServerHealth() {
  const check = sharedHealth
  sharedHealth = undefined
  healthDelayed.value = false
  if (check) {
    clearTimeout(check.delay)
    check.controller.abort()
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const id = Symbol(path)
  // Each data request keeps its own timeout and cancellation controller.
  const controller = new AbortController()
  pending.set(id, 'loading')
  const delay = setTimeout(() => {
    pending.set(id, 'slow')
    checkServerHealth()
  }, 4000)
  const timeout = setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(
        typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'The server took too long to respond. Please try again. If you were saving a change, check whether it was saved first.',
      )
    }
    throw error
  } finally {
    clearTimeout(delay)
    clearTimeout(timeout)
    pending.delete(id)
    // One request finishing must not cancel a check that others still use.
    // Once idle, reset so a future visit can check for a new cold start.
    if (pending.size === 0) resetServerHealth()
  }
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },

  post<T>(path: string, data: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  patch<T>(path: string, data: unknown) {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete<T = void>(path: string) {
    return request<T>(path, { method: 'DELETE' })
  },
}
