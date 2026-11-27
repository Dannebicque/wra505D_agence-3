import type { User } from '../../shared/types/utilisateur'

// Provisoire (phase Nitro) : l'utilisateur connecté, posé par `middleware/auth-session.ts`
// (qui répond déjà 401 sans session).
export default defineEventHandler((event): User => {
  const user: User | undefined = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
})
