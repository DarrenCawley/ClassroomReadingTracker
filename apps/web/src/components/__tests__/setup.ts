import { beforeEach } from 'vitest'
import { setSession } from '../../auth/session'

// Existing editing tests exercise the signed-in teacher view.
beforeEach(() =>
  setSession({
    key: 'teacher:test',
    ready: true,
    userId: 'test-teacher',
    getToken: async () => 'test-token',
  }),
)
