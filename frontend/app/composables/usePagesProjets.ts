import type { Iri } from '#shared/types/api'
import type { Page, PageInfo } from '#shared/types/portfolio'
import { iri, idFromIri } from '#shared/utils/iri'
import { ApiError } from '~/services/errors'
import { createSerialQueue } from '~/utils/serial-queue'

/** Page affichée dans la liste réordonnable (son identifiant sert de clé). */
export type PageItem = Page & { id: string }

const toItem = (page: Page): PageItem => ({ ...page, id: idFromIri(page['@id']) })

export type OrderSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Pages-projets d'un portfolio (E-PG-01, E-PG-02, E-PG-04) : chargement, création, suppression et
 * ordre. Chaque déplacement est enregistré tout de suite ; un seul envoi à la fois, et un échec
 * remet la liste dans le dernier ordre enregistré.
 */
export function usePagesProjets(portfolioId: string) {
  const store = usePortfolioStore()
  const portfolioIri = iri('portfolios', portfolioId)
  const { data, status, error, refresh } = useAsyncData(`pages-projets-${portfolioId}`, () =>
    store.listPages(portfolioIri),
  )

  const pages = ref<PageItem[]>([])
  /** Ordre connu du serveur : sert à annuler un déplacement refusé. */
  let saved: Iri[] = []
  watch(
    data,
    (loaded) => {
      pages.value = (loaded ?? []).map(toItem)
      saved = pages.value.map((page) => page['@id'])
    },
    { immediate: true },
  )

  const queue = createSerialQueue()
  const orderStatus = ref<OrderSaveStatus>('idle')
  const orderError = ref<unknown>(null)

  /** Remet les pages affichées dans l'ordre enregistré. */
  function restoreSavedOrder() {
    pages.value = saved
      .map((pageIri) => pages.value.find((page) => page['@id'] === pageIri))
      .filter((page): page is PageItem => page !== undefined)
  }

  /** Nombre d'échecs : un appel sait ainsi si son changement a été annulé pendant son attente. */
  let failures = 0

  /**
   * Nouvel ordre choisi par l'étudiant (glisser-déposer ou flèches). Renvoie `false` si cet ordre
   * n'a pas été enregistré : refusé, ou annulé par l'échec d'un envoi précédent.
   */
  async function reorder(next: PageItem[]): Promise<boolean> {
    pages.value = next
    orderStatus.value = 'saving'
    orderError.value = null
    const failuresBefore = failures
    await queue.runLatest('ordre', async () => {
      const order = pages.value.map((page) => page['@id'])
      if (order.join() === saved.join()) {
        // Rien à envoyer. Après un échec, la liste a été remise en état : l'erreur reste affichée
        if (orderStatus.value === 'saving') orderStatus.value = 'saved'
        return
      }
      try {
        saved = (await store.setPageOrder(portfolioId, order)).pages
        orderStatus.value = 'saved'
      } catch (cause) {
        failures++
        orderError.value = cause
        orderStatus.value = 'error'
        restoreSavedOrder()
      }
    })
    return failures === failuresBefore
  }

  /** Crée la page en fin de liste. Les erreurs (dont la validation) sont rendues à l'appelant. */
  function create(info: PageInfo): Promise<PageItem> {
    return queue.run(async () => {
      const page = toItem(await store.createPage(portfolioIri, info))
      pages.value = [...pages.value, page]
      saved = [...saved, page['@id']]
      return page
    })
  }

  /**
   * Envoie la page à la corbeille. Les erreurs sont rendues à l'appelant ; une page déjà supprimée
   * (404, par exemple après une double confirmation) compte comme supprimée.
   */
  function remove(page: PageItem): Promise<void> {
    return queue.run(async () => {
      try {
        await store.deletePage(page.id)
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 404)) throw cause
      }
      pages.value = pages.value.filter((p) => p['@id'] !== page['@id'])
      saved = saved.filter((pageIri) => pageIri !== page['@id'])
    })
  }

  return { pages, status, error, refresh, orderStatus, orderError, reorder, create, remove }
}
