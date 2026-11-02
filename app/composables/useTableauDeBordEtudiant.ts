import { getEtudiant } from '~/services/etudiant'
import { listReferentiels } from '~/services/referentiel'
import { listTraces } from '~/services/trace'
import { listValidations } from '~/services/validation'

/**
 * Étudiante de démo, en attendant la connexion (Solène) : l'identifiant viendra
 * de l'utilisateur connecté.
 */
const DEMO_ETUDIANT_ID = 1

/** Données et calculs du tableau de bord de l'espace étudiant. */
export function useTableauDeBordEtudiant() {
  const { data, status, error, refresh } = useAsyncData('tableau-de-bord-etudiant', async () => {
    const [etudiant, traces, validations, referentiels] = await Promise.all([
      getEtudiant(DEMO_ETUDIANT_ID),
      listTraces(),
      listValidations(),
      listReferentiels(),
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

  return { data, status, error, refresh, counters, progression, drafts }
}
