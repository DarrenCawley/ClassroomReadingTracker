import { computed, shallowRef } from 'vue'

interface SessionContext {
  key: string
  ready: boolean
  userId: string | null
  getToken: () => Promise<string | null>
}

const session = shallowRef<SessionContext>({
  key: 'loading',
  ready: false,
  userId: null,
  getToken: async () => null,
})
export const sessionKey = computed(() => session.value.key)
export const authReady = computed(() => session.value.ready)
export const isDemo = computed(() => session.value.ready && !session.value.userId)
let revision = 0
export const sessionRevision = () => revision

export function setSession(context: SessionContext) {
  if (session.value.key !== context.key) revision++
  session.value = context
}

export function assertCurrentSession(expected: number) {
  if (expected !== revision) throw new Error('Your account changed. Please try again.')
}

export async function requestContext(path: string, method: string) {
  const current = session.value
  if (!current.ready) throw new Error('Your account is still loading. Please wait.')
  const trackerResource = /^\/(students|books|assignments)(\/|$)/.test(path)
  if (!current.userId && trackerResource) {
    if (method !== 'GET') throw new Error('The demo is read-only. Sign in to use your own tracker.')
    return { path: `/demo${path}`, token: null }
  }
  const token = current.userId ? await current.getToken() : null
  if (current.userId && !token) throw new Error('Your session expired. Please sign in again.')
  return { path, token }
}
