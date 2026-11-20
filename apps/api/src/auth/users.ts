import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { AuthIdentity } from './clerk'

export async function findOrCreateUser(identity: AuthIdentity) {
  const condition = and(
    eq(users.authProvider, identity.provider),
    eq(users.authSubjectId, identity.subject),
  )
  const [existing] = await db.select().from(users).where(condition).limit(1)
  if (existing) return existing

  // The unique auth identity also handles simultaneous first requests.
  const [created] = await db
    .insert(users)
    .values({ authProvider: identity.provider, authSubjectId: identity.subject })
    .onConflictDoNothing({ target: [users.authProvider, users.authSubjectId] })
    .returning()
  if (created) return created

  const [concurrent] = await db.select().from(users).where(condition).limit(1)
  if (!concurrent) throw new Error('Could not resolve the application user.')
  return concurrent
}
