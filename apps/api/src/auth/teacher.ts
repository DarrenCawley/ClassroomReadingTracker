import type { RequestHandler } from 'express'
import { getAuthIdentity } from './clerk'
import { findOrCreateUser } from './users'

export const requireTeacher: RequestHandler = async (req, res, next) => {
  const identity = getAuthIdentity(req)
  if (!identity) {
    res.status(401).json({ error: 'Sign in to access your tracker.' })
    return
  }
  const user = await findOrCreateUser(identity)
  res.locals.ownerUserId = user.id
  next()
}
