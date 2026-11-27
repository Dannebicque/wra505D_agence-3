// Provisoire (phase Nitro) : connexion simulée, doublure de l'API pour les tests et la CI. Avec
// NUXT_API_PROXY, `api-proxy.ts` (qui passe avant, par ordre alphabétique) relaie /api/** vers l'API
// et ce contrôle ne s'applique pas. Comme l'API, toute route /api/** exige une connexion, sauf
// celles de `isPublicApiRequest` ; les pages du front, elles, passent toujours.
import { compteByUsername } from '../data/comptes'
import { sessionStore } from '../data/sessions'

export default defineEventHandler((event) => {
  const compte = compteByUsername(sessionStore.username(getCookie(event, SESSION_COOKIE)))
  event.context.user = compte?.user

  if (!compte && isApiRequest(event.path) && !isPublicApiRequest(event.path, event.method)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Full authentication is required to access this resource.',
    })
  }
})
