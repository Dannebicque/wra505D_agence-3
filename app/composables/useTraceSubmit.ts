import type { Violation } from '#shared/types/api'
import type { TraceInput } from '#shared/types/trace'
import { toApiError } from '~/services/errors'

interface FormWithServerErrors {
  /** Affiche les erreurs sous les champs et renvoie celles qui n'ont pas de champ. */
  setServerErrors: (violations: Violation[]) => Violation[]
}

/**
 * Enregistrement d'une trace depuis une page (création ou modification) : message de réussite,
 * retour à la liste, erreurs du serveur sous chaque champ ou en notification.
 */
export function useTraceSubmit(id: () => string | null, form: Ref<FormWithServerErrors | null>) {
  const store = useTraceStore()
  const toast = useToast()
  const submitting = ref(false)

  async function submit(input: TraceInput) {
    submitting.value = true
    try {
      await store.save(id(), input)
      toast.add({
        title: input.statut === 'brouillon' ? 'Brouillon enregistré' : 'Trace finalisée',
        color: 'success',
      })
      await navigateTo('/etudiant/traces')
    } catch (error) {
      const apiError = toApiError(error)
      // Jamais d'erreur silencieuse : ce qui ne peut pas s'afficher sous un champ part en notification
      const unmatched = apiError.violations.length
        ? (form.value?.setServerErrors(apiError.violations) ?? apiError.violations)
        : []
      if (!apiError.violations.length || unmatched.length) {
        toast.add({
          title: 'Enregistrement impossible',
          description: unmatched.length
            ? unmatched.map((v) => v.message).join(' ')
            : apiError.message,
          color: 'error',
        })
      }
    } finally {
      submitting.value = false
    }
  }

  return { submit, submitting }
}
