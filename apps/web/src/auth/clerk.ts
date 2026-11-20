import { watch } from 'vue'
import { useAuth } from '@clerk/vue'
import { setSession } from './session'

// Keep Clerk's reactive API at the edge of the application.
export function useClerkSession() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()
  watch(
    [isLoaded, isSignedIn, userId, sessionId],
    ([ready, signedIn, id, sid]) => {
      setSession({
        key: !ready ? 'loading' : signedIn && id ? `teacher:${id}:${sid}` : 'demo',
        ready,
        userId: signedIn && id ? id : null,
        getToken: () => getToken.value(),
      })
    },
    { immediate: true, flush: 'sync' },
  )
}
