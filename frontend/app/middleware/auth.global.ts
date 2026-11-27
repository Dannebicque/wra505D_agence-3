import { errorMessage } from '~/services/errors'

/**
 * Garde des espaces (C-13) : `/etudiant`, `/enseignant` et `/admin` exigent une connexion et le
 * rôle de l'espace ; la page de connexion renvoie un utilisateur déjà connecté vers son espace.
 * Ce n'est qu'un confort de navigation : l'API refuse elle-même tout accès non permis.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const espace = espaceFromPath(to.path)
  const isLoginPage = to.path === '/connexion'
  if (!espace && !isLoginPage) return

  const auth = useAuthStore()
  try {
    await auth.ensureLoaded()
  } catch (error) {
    // Page de connexion : le formulaire reste utilisable, son envoi signalera lui-même la panne
    if (isLoginPage) return
    // L'API ne répond pas (ou répond une erreur) : impossible de savoir qui est connecté.
    // Côté serveur, Nuxt affiche lui-même la page d'erreur ; côté navigateur, l'annulation seule
    // laisserait l'utilisateur sur la page précédente sans rien lui dire.
    const unavailable = createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: errorMessage(error),
    })
    if (import.meta.client) showError(unavailable)
    return abortNavigation(unavailable)
  }

  if (isLoginPage) {
    const target = auth.isLoggedIn ? pathAfterLogin(auth.roles, to.query.redirect) : null
    return target ? navigateTo(target, { replace: true }) : undefined
  }

  if (!auth.isLoggedIn) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
  if (espace && !canAccessEspace(auth.roles, espace)) {
    // Connecté, mais pas dans cet espace : retour au sien (ou à la connexion s'il n'en a aucun)
    return navigateTo(auth.home ? `/${auth.home}` : '/connexion', { replace: true })
  }
})
