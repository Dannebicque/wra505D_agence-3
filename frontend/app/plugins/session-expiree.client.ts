import { setUnauthorizedHandler } from '~/services/api'

/**
 * Session expirée pendant le travail (C-13) : tout 401 de l'API renvoie vers la connexion, puis vers
 * la page en cours une fois reconnecté. Rechargement complet : rien de la session précédente (stores,
 * données en cache) ne survit. Hors des espaces (portfolio public…), aucun renvoi.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  let isRedirecting = false

  setUnauthorizedHandler(() => {
    const current = router.currentRoute.value
    if (isRedirecting || !espaceFromPath(current.path)) return
    isRedirecting = true
    reloadNuxtApp({
      path: `/connexion?redirect=${encodeURIComponent(current.fullPath)}`,
      force: true,
    })
  })
})
