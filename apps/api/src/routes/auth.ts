import { Router } from 'express'
import { getAuthIdentity } from '../auth/clerk'
import { findOrCreateUser } from '../auth/users'

export const authRouter = Router()

authRouter.get('/me', async (req, res) => {
  const identity = getAuthIdentity(req)
  if (!identity) {
    res.status(401).json({ error: 'Sign in to access your account.' })
    return
  }

  const user = await findOrCreateUser(identity)
  res.json({ user })
})
