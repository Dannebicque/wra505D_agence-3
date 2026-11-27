import { ApiError } from '~/services/errors'
import { getEtudiant } from '~/services/etudiant'
import { listReferentiels } from '~/services/referentiel'
import { listTraces } from '~/services/trace'
import { listValidations } from '~/services/validation'

/** Données et calculs du tableau de bord de l'espace étudiant. */
export function useTableauDeBordEtudiant() {
  const requestOptions = useApiRequestOptions()
  const auth = useAuthStore()
  const { data, status, error, refresh } = useAsyncData('tableau-de-bord-etudiant', async () => {
    // Le garde de route a déjà vérifié la connexion et le rôle ; un compte sans fiche étudiant
    // est un cas d'erreur à montrer, pas un tableau de bord vide
    const etudiantIri = auth.user?.etudiant
    if (!etudiantIri) throw new ApiError(404, 'Aucune fiche étudiant n’est liée à votre compte.')
    const [etudiant, traces, validations, referentiels] = await Promise.all([
      getEtudiant(idFromIri(etudiantIri), requestOptions),
      listTraces(requestOptions),
      listValidations(requestOptions),
      listReferentiels(requestOptions),
    ])
    return { etudiant, traces, validations, referentiel: referentiels[0] ?? null }
  })

  const counters = computed(() =>
    data.value ? computeCounters(data.value.traces, data.value.validations) : null,
  )
  const progression = computed(() =>
    data.value?.referentiel
      ? computeProgression(data.value.referentiel, data.value.traces, data.value.validations)
      : [],
  )
  const drafts = computed(() => (data.value ? draftTraces(data.value.traces) : []))
  const draftCompetences = computed(() =>
    data.value?.referentiel
      ? draftCompetenceIds(data.value.referentiel, data.value.traces, data.value.validations)
      : new Set<string>(),
  )

  return { data, status, error, refresh, counters, progression, drafts, draftCompetences }
}
