import type { Enseignant, Etudiant, User } from '#shared/types/utilisateur'
import type { ApiFetchOptions } from '~/services/api'
import { getMe, login as apiLogin, logout as apiLogout, type Credentials } from '~/services/auth'
import { getEnseignant } from '~/services/enseignant'
import { ApiError } from '~/services/errors'
import { getEtudiant } from '~/services/etudiant'

/**
 * Utilisateur connecté (C-13). Lu une fois par chargement de l'application, par le garde de route
 * (`middleware/auth.global.ts`) : pendant le rendu serveur avec le cookie du visiteur, puis transmis
 * au navigateur avec l'état de Pinia (pas de second appel à l'hydratation).
 */
export const useAuthStore = defineStore('auth', () => {
  // Capturées à la création du store (dans `setup`) : le contexte Nuxt est perdu après un `await`
  const requestOptions = useApiRequestOptions()

  const user = ref<User | null>(null)
  /** Fiche de l'étudiant ou de l'enseignant (nom affiché) ; `null` pour un administrateur. */
  const profil = ref<Etudiant | Enseignant | null>(null)
  const isLoaded = ref(false)

  const roles = computed(() => user.value?.roles ?? [])
  const isLoggedIn = computed(() => user.value !== null)
  const home = computed(() => homeEspace(roles.value))
  const displayName = computed(() =>
    profil.value ? `${profil.value.prenom} ${profil.value.nom}` : (user.value?.username ?? ''),
  )

  /**
   * Fiche liée au compte. Sans elle, le nom affiché retombe sur l'identifiant de connexion : une
   * fiche illisible ne doit pas empêcher d'entrer dans l'espace.
   */
  async function loadProfil(me: User, options: ApiFetchOptions) {
    try {
      if (me.etudiant) return await getEtudiant(idFromIri(me.etudiant), options)
      if (me.enseignant) return await getEnseignant(idFromIri(me.enseignant), options)
    } catch {
      // Repli voulu (voir ci-dessus) : le reste de l'espace signale ses propres erreurs
    }
    return null
  }

  /** Relit l'utilisateur ; un 401 veut dire « personne n'est connecté », toute autre erreur remonte. */
  async function refresh(options: ApiFetchOptions = requestOptions) {
    try {
      const me = await getMe(options)
      profil.value = await loadProfil(me, options)
      user.value = me
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
      user.value = null
      profil.value = null
    }
    isLoaded.value = true
  }

  async function ensureLoaded() {
    if (!isLoaded.value) await refresh()
  }

  /** Ouvre la session puis lit l'utilisateur. Les erreurs (`ApiError`) sont à afficher par l'appelant. */
  async function login(credentials: Credentials) {
    await apiLogin(credentials)
    // Côté navigateur : le cookie de session vient d'être posé, il part tout seul
    await refresh({})
  }

  /** Ferme la session côté serveur. L'appelant recharge ensuite l'application (voir `useLogout`). */
  async function logout() {
    await apiLogout()
    user.value = null
    profil.value = null
  }

  return {
    user,
    profil,
    isLoaded,
    roles,
    isLoggedIn,
    home,
    displayName,
    refresh,
    ensureLoaded,
    login,
    logout,
  }
})
