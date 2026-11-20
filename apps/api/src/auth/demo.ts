// This internal identity has no Clerk login. Public demo reads will use it explicitly.
export const DEMO_IDENTITY = {
  provider: 'demo',
  subject: 'public-demo',
} as const
