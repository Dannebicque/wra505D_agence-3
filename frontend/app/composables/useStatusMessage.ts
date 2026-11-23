/**
 * Message d'une zone `role="status"` propre à la page (le `useAnnouncer` de Nuxt suppose un
 * `<NuxtAnnouncer>` global et ne relit pas un message identique). Un lecteur d'écran n'annonce qu'un changement de contenu :
 * deux messages identiques à la suite (« Langue ajoutée. » deux fois) ne seraient lus qu'une fois.
 * `announce` vide donc la zone, puis la réécrit un peu plus tard, dans une tâche séparée : vidée et
 * réécrite dans la même tâche, la zone ne changerait pas aux yeux de l'arbre d'accessibilité.
 */
const REWRITE_DELAY_MS = 100

export function useStatusMessage() {
  const message = ref('')
  let pending: ReturnType<typeof setTimeout> | undefined
  let settlePending: (() => void) | undefined

  function cancelPending() {
    clearTimeout(pending)
    // L'appel remplacé se termine sans rien écrire : qui l'attendait n'est pas bloqué
    settlePending?.()
    settlePending = undefined
  }

  function announce(text: string): Promise<void> {
    cancelPending()
    message.value = ''
    return new Promise((resolve) => {
      settlePending = resolve
      pending = setTimeout(() => {
        message.value = text
        settlePending = undefined
        resolve()
      }, REWRITE_DELAY_MS)
    })
  }

  /** Efface le message (et l'annonce en attente), par exemple au début d'une nouvelle action. */
  function clear() {
    cancelPending()
    message.value = ''
  }

  onScopeDispose(cancelPending)

  return { message: readonly(message), announce, clear }
}
