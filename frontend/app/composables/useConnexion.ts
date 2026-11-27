import type { Credentials } from '~/services/auth'
import { ApiError, errorMessage } from '~/services/errors'

/** Mot de passe des comptes de démonstration (fixtures de l'API et doublure Nitro). */
const DEMO_PASSWORD = 'test'

/**
 * Connexion (C-13), partagée par la page de connexion et les accès de démonstration : ouvre la
 * session, puis mène à la page demandée (`?redirect=`) ou à l'accueil de l'espace de l'utilisateur.
 * Toute erreur est gardée dans `error`, en français, pour être affichée près du formulaire.
 */
export function useConnexion() {
  const auth = useAuthStore()
  const route = useRoute()
  const isPending = ref(false)
  const error = ref<string | null>(null)

  async function connect(credentials: Credentials): Promise<boolean> {
    if (isPending.value) return false
    isPending.value = true
    error.value = null
    const restoreFocus = captureFocus()
    const previousUser = auth.user?.['@id'] ?? null
    try {
      await auth.login(credentials)
    } catch (cause) {
      error.value =
        cause instanceof ApiError
          ? loginErrorMessage(cause.status, cause.message)
          : errorMessage(cause)
      isPending.value = false
      restoreFocus()
      return false
    }

    const target = pathAfterLogin(auth.roles, route.query.redirect)
    if (!target) {
      error.value = 'Votre compte n’a accès à aucun espace d’UniFolio. Contactez l’équipe de l’IUT.'
      isPending.value = false
      restoreFocus()
      return false
    }
    // Changement de compte sans déconnexion (accès de démonstration depuis l'accueil) : rechargement
    // complet, pour qu'aucune donnée en cache de l'utilisateur précédent ne s'affiche
    if (previousUser && previousUser !== auth.user?.['@id']) {
      reloadNuxtApp({ path: target, force: true })
      return true
    }
    // Depuis la page de connexion, elle sort de l'historique (« Retour » n'y ramène pas) ; depuis
    // l'accueil, elle y reste
    await navigateTo(target, { replace: route.path === '/connexion' })
    isPending.value = false
    return true
  }

  const connectDemo = (username: string) => connect({ username, password: DEMO_PASSWORD })

  return { connect, connectDemo, isPending, error }
}
