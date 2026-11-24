import { listReferentiels } from '~/services/referentiel'
import { listValidations } from '~/services/validation'

/** Traces de l'étudiant avec leurs compétences, et compétences du référentiel pour les filtres. */
export function useBibliotheque() {
  const store = useTraceStore()
  const requestOptions = useApiRequestOptions()
  const { data, status, error, refresh } = useAsyncData('bibliotheque', async () => {
    const [traces, validations, referentiels] = await Promise.all([
      store.list(),
      listValidations(requestOptions),
      listReferentiels(requestOptions),
    ])
    return { traces, validations, referentiel: referentiels[0] ?? null }
  })

  const items = computed(() =>
    data.value
      ? tracesWithCompetences(data.value.traces, data.value.validations, data.value.referentiel)
      : [],
  )
  const competences = computed(() => data.value?.referentiel?.competences ?? [])

  return { items, competences, status, error, refresh }
}
