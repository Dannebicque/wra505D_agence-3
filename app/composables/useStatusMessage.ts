/**
 * Message d'une zone `role="status"` propre à la page (le `useAnnouncer` de Nuxt suppose un
 * `<NuxtAnnouncer>` global et ne relit pas un message identique). Un lecteur d'écran n'annonce qu'un changement de contenu :
 * deux messages identiques à la suite (« Langue ajoutée. » deux fois) ne seraient lus qu'une fois.
 * `announce` vide donc la zone, puis la réécrit au rendu suivant.
 */
export function useStatusMessage() {
  const message = ref('')

  async function announce(text: string) {
    message.value = ''
    await nextTick()
    message.value = text
  }

  return { message: readonly(message), announce }
}
