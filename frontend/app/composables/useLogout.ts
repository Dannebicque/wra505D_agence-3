import { errorMessage } from '~/services/errors'

/**
 * Déconnexion (C-13) : ferme la session puis recharge l'application sur la page de connexion, pour
 * que rien de l'utilisateur précédent (stores, données en cache) ne reste en mémoire. En cas
 * d'échec, la session est toujours ouverte : on le dit, sans faire semblant de déconnecter.
 */
export function useLogout() {
  const auth = useAuthStore()
  const toast = useToast()
  const isPending = ref(false)

  async function logout() {
    if (isPending.value) return
    isPending.value = true
    const restoreFocus = captureFocus()
    try {
      await auth.logout()
      reloadNuxtApp({ path: '/connexion', force: true })
    } catch (error) {
      isPending.value = false
      restoreFocus()
      toast.add({
        title: 'Déconnexion impossible',
        description: errorMessage(error),
        color: 'error',
        icon: 'i-lucide-circle-alert',
      })
    }
  }

  return { logout, isPending }
}
