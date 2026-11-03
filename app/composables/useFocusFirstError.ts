import type { FormErrorEvent } from '@nuxt/ui'

/**
 * Après un envoi refusé, place le focus sur le premier champ en erreur (clavier, lecteur d'écran) :
 * à brancher sur l'événement `@error` d'un `UForm`.
 *
 *   const { onError } = useFocusFirstError()
 *   <UForm … @error="onError">
 */
export function useFocusFirstError() {
  function focusField(id: string | undefined, name: string | undefined) {
    const field =
      (id ? document.getElementById(id) : null) ??
      (name ? document.getElementsByName(name)[0] : undefined)
    field?.focus()
  }

  function onError(event: FormErrorEvent) {
    const first = event.errors[0]
    // Pendant l'envoi, UForm désactive les champs (un champ désactivé refuse le focus) et ne les
    // réactive qu'après avoir émis l'erreur : on attend la fin de ce rendu
    setTimeout(() => focusField(first?.id, first?.name))
  }

  return { onError }
}
