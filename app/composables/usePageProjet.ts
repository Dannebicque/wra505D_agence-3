import type { Iri } from '#shared/types/api'
import type { PageInfo } from '#shared/types/portfolio'
import type { Competence } from '#shared/types/referentiel'
import type { Trace } from '#shared/types/trace'
import { iri, idFromIri } from '#shared/utils/iri'
import { ApiError } from '~/services/errors'
import { createSerialQueue } from '~/utils/serial-queue'
import type { OrderSaveStatus } from './usePagesProjets'

/** Trace affichée dans la liste réordonnable de la page. */
export interface PageTraceItem {
  id: string
  trace: Trace
  competences: Competence[]
}

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error'

/** Statut d'un écran qui dépend de plusieurs chargements. */
function combinedStatus(statuses: AsyncStatus[]): AsyncStatus {
  if (statuses.includes('error')) return 'error'
  if (statuses.every((s) => s === 'success')) return 'success'
  return statuses.includes('pending') ? 'pending' : 'idle'
}

/**
 * Une page-projet et ses traces ordonnées (E-PG-01, E-TR-08). L'ajout, le retrait et le déplacement
 * d'une trace sont enregistrés tout de suite, un envoi à la fois ; un échec remet les traces telles
 * qu'enregistrées. À attendre (`await`) dans `setup` : une page introuvable doit répondre 404.
 */
export async function usePageProjet(portfolioId: string, pageId: string) {
  const store = usePortfolioStore()
  const bibliotheque = useBibliotheque()

  const pageData = useAsyncData(`page-projet-${portfolioId}-${pageId}`, async () => {
    const [page, portfolio, pages] = await Promise.all([
      store.getPage(pageId),
      store.get(portfolioId),
      store.listPages(iri('portfolios', portfolioId)),
    ])
    // Une page d'un autre portfolio est introuvable à cette adresse
    if (page.portfolio !== portfolio['@id']) throw new ApiError(404, 'Page introuvable.')
    // Une trace ne figure que dans une page par portfolio (E-TR-06 retirée)
    const usedElsewhere = pages.filter((p) => p['@id'] !== page['@id']).flatMap((p) => p.traces)
    return { page, portfolio, usedElsewhere }
  })
  const { data, refresh } = pageData

  const info = ref<PageInfo>({ intitule: '', description: null })
  const traceIris = ref<Iri[]>([])
  /** Traces telles qu'enregistrées : sert à annuler un changement refusé. */
  let saved: Iri[] = []
  watch(
    data,
    (loaded) => {
      if (!loaded) return
      info.value = { intitule: loaded.page.intitule, description: loaded.page.description }
      traceIris.value = [...loaded.page.traces]
      saved = [...loaded.page.traces]
    },
    { immediate: true },
  )

  const byIri = computed(
    () => new Map(bibliotheque.items.value.map((item) => [item.trace['@id'], item])),
  )

  /** Traces de la page dans leur ordre. Une trace partie à la corbeille n'est pas affichée. */
  const traces = computed<PageTraceItem[]>(() =>
    traceIris.value.flatMap((traceIri) => {
      const item = byIri.value.get(traceIri)
      return item && item.trace.dateSuppression === null
        ? [{ id: idFromIri(traceIri), trace: item.trace, competences: item.competences }]
        : []
    }),
  )

  const finalisees = computed(() =>
    bibliotheque.items.value.filter(
      ({ trace }) => trace.statut === 'finalisee' && trace.dateSuppression === null,
    ),
  )
  /** Traces finalisées qu'on peut ajouter : ni dans cette page, ni dans une autre du portfolio. */
  const available = computed(() =>
    finalisees.value.filter(
      ({ trace }) =>
        !traceIris.value.includes(trace['@id']) &&
        !data.value?.usedElsewhere.includes(trace['@id']),
    ),
  )
  /** Nombre de traces finalisées déjà placées dans une autre page de ce portfolio. */
  const usedElsewhereCount = computed(
    () =>
      finalisees.value.filter(({ trace }) => data.value?.usedElsewhere.includes(trace['@id']))
        .length,
  )

  const queue = createSerialQueue()
  const tracesStatus = ref<OrderSaveStatus>('idle')
  const tracesError = ref<unknown>(null)

  /** Nombre d'échecs : un appel sait ainsi si son changement a été annulé pendant son attente. */
  let failures = 0

  /**
   * Affiche puis enregistre les traces. Renvoie `false` si ce changement n'a pas été enregistré :
   * refusé, ou annulé par l'échec d'un envoi précédent.
   */
  async function saveTraces(next: Iri[]): Promise<boolean> {
    traceIris.value = next
    tracesStatus.value = 'saving'
    tracesError.value = null
    const failuresBefore = failures
    await queue.runLatest('traces', async () => {
      const current = [...traceIris.value]
      if (current.join() === saved.join()) {
        // Rien à envoyer. Après un échec, la page a été remise en état : l'erreur reste affichée
        if (tracesStatus.value === 'saving') tracesStatus.value = 'saved'
        return
      }
      try {
        saved = (await store.updatePage(pageId, { traces: current })).traces
        tracesStatus.value = 'saved'
      } catch (cause) {
        failures++
        tracesError.value = cause
        tracesStatus.value = 'error'
        traceIris.value = [...saved]
      }
    })
    return failures === failuresBefore
  }

  /** Nouvel ordre des traces affichées ; les traces masquées (corbeille) restent en fin de page. */
  function reorderTraces(next: PageTraceItem[]): Promise<boolean> {
    const shown = next.map((item) => item.trace['@id'])
    const hidden = traceIris.value.filter((traceIri) => !shown.includes(traceIri))
    return saveTraces([...shown, ...hidden])
  }

  const addTraces = (added: Iri[]) => saveTraces([...traceIris.value, ...added])
  const removeTrace = (removed: Iri) =>
    saveTraces(traceIris.value.filter((traceIri) => traceIri !== removed))

  /** Enregistre l'intitulé et la description. Les erreurs (dont la validation) sont rendues. */
  function saveInfo(next: PageInfo): Promise<void> {
    return queue.run(async () => {
      const page = await store.updatePage(pageId, next)
      info.value = { intitule: page.intitule, description: page.description }
    })
  }

  const status = computed(() => combinedStatus([pageData.status.value, bibliotheque.status.value]))
  const error = computed(() => pageData.error.value ?? bibliotheque.error.value)

  await pageData

  return {
    portfolio: computed(() => data.value?.portfolio ?? null),
    info,
    traces,
    available,
    usedElsewhereCount,
    status,
    error,
    refresh: () => Promise.all([refresh(), bibliotheque.refresh()]),
    tracesStatus,
    tracesError,
    reorderTraces,
    addTraces,
    removeTrace,
    saveInfo,
  }
}
