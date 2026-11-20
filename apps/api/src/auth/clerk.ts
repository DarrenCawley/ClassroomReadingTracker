import { clerkMiddleware, getAuth } from '@clerk/express'
import type { Request } from 'express'

export interface AuthIdentity {
  provider: 'clerk'
  subject: string
}

export function createAuthMiddleware() {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY

  if (!publishableKey || !secretKey) {
    throw new Error('Set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in apps/api/.env.local.')
  }

  return clerkMiddleware({ publishableKey, secretKey })
}

export function getAuthIdentity(req: Request): AuthIdentity | null {
  const { userId } = getAuth(req)
  return userId ? { provider: 'clerk', subject: userId } : null
}
