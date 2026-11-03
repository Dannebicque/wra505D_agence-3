import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Violation } from '#shared/types/api'
import { ApiError } from '~/services/errors'
import { useTraceStore } from '~/stores/trace'

const INPUT = {
  titre: 'A',
  description: null,
  contexte: null,
  type: 'lien' as const,
  contenu: [],
  statut: 'brouillon' as const,
  conceptionIa: 'non_renseigne' as const,
  realisationIa: 'non_renseigne' as const,
  dateRealisation: null,
}

function setup(error: unknown) {
  vi.spyOn(useTraceStore(), 'save').mockRejectedValue(error)
  const setServerErrors = vi.fn((violations: Violation[]) =>
    violations.filter((v) => v.propertyPath === 'statut'),
  )
  const { submit, submitting } = useTraceSubmit(() => null, ref({ setServerErrors }))
  return { submit, submitting, setServerErrors, toasts: useToast().toasts }
}

describe('useTraceSubmit', () => {
  it('place les erreurs 422 sous les champs et notifie celles sans champ', async () => {
    const { submit, setServerErrors, toasts, submitting } = setup(
      new ApiError(422, 'Erreur', [
        { propertyPath: 'titre', message: 'Titre refusé.' },
        { propertyPath: 'statut', message: 'Statut refusé.' },
      ]),
    )

    expect(await submit(INPUT)).toBe(false)

    expect(setServerErrors).toHaveBeenCalledOnce()
    expect(toasts.value.at(-1)?.description).toBe('Statut refusé.')
    expect(submitting.value).toBe(false)
  })

  it('notifie une erreur sans détail de champ avec son message français', async () => {
    const { submit, toasts } = setup(new ApiError(0, 'Impossible de joindre le serveur.'))

    await submit(INPUT)

    expect(toasts.value.at(-1)).toMatchObject({
      title: 'Enregistrement impossible',
      description: 'Impossible de joindre le serveur.',
    })
  })
})
