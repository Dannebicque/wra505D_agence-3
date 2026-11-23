import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { Iri } from '#shared/types/api'
import type { Page, PageInfo, Portfolio } from '#shared/types/portfolio'
import { usePagesProjets } from '~/composables/usePagesProjets'
import { ApiError } from '~/services/errors'

const page = (id: number, intitule: string): Page => ({
  '@id': `/api/pages/${id}`,
  '@type': 'Page',
  portfolio: '/api/portfolios/1',
  intitule,
  description: null,
  traces: [],
  dateSuppression: null,
})

const portfolio = (order: Iri[]): Portfolio => ({
  '@id': '/api/portfolios/1',
  '@type': 'Portfolio',
  etudiant: '/api/etudiants/1',
  annee: '/api/annees/2',
  intitule: 'Portfolio',
  description: null,
  banniere: null,
  visibilite: 'publique',
  visibleRecruteurs: false,
  pages: order,
  dateCreation: '2026-09-01',
  dateModification: null,
  dateSuppression: null,
})

// Réponses modifiées par chaque test
let pages = [page(1, 'BDE'), page(2, 'Festival')]
let orderFails = false
let createError: ApiError | null = null
let deleteError: ApiError | null = null
const sentOrders: Iri[][] = []

// Chargement par la vraie route (service, collection Hydra) ; les écritures sont espionnées sur le store
registerEndpoint('/api/pages', () => ({
  '@id': '/api/pages',
  '@type': 'Collection',
  member: pages,
}))

/** Retient l'envoi en cours tant qu'elle n'est pas résolue (envoi « lent »). */
let gate: Promise<void> | null = null
const tick = () => new Promise((resolve) => setTimeout(resolve))

async function mountComposable() {
  let result!: ReturnType<typeof usePagesProjets>
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        const store = usePortfolioStore()
        vi.spyOn(store, 'setPageOrder').mockImplementation(async (_id: string, order: Iri[]) => {
          sentOrders.push(order)
          if (gate) await gate
          if (orderFails) throw new ApiError(422, 'Ordre refusé.')
          return portfolio(order)
        })
        vi.spyOn(store, 'createPage').mockImplementation(
          async (_portfolio: Iri, info: PageInfo) => {
            if (createError) throw createError
            return page(9, info.intitule)
          },
        )
        vi.spyOn(store, 'deletePage').mockImplementation(async () => {
          if (deleteError) throw deleteError
        })
        result = usePagesProjets('1')
        return () => h('div')
      },
    }),
  )
  await vi.waitFor(() => expect(result.status.value).toBe('success'))
  return { wrapper, result }
}

const titles = (result: ReturnType<typeof usePagesProjets>) =>
  result.pages.value.map((p) => p.intitule)

describe('usePagesProjets', () => {
  let wrapper: { unmount(): void } | undefined

  afterEach(() => {
    wrapper?.unmount()
    pages = [page(1, 'BDE'), page(2, 'Festival')]
    orderFails = false
    createError = null
    deleteError = null
    gate = null
    sentOrders.length = 0
  })

  it('charge les pages dans leur ordre, avec un identifiant par page', async () => {
    const mounted = await mountComposable()
    wrapper = mounted.wrapper

    expect(titles(mounted.result)).toEqual(['BDE', 'Festival'])
    expect(mounted.result.pages.value[0]?.id).toBe('1')
  })

  it('enregistre le nouvel ordre tout de suite', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w

    await result.reorder([...result.pages.value].reverse())

    expect(sentOrders).toEqual([['/api/pages/2', '/api/pages/1']])
    expect(result.orderStatus.value).toBe('saved')
    expect(titles(result)).toEqual(['Festival', 'BDE'])
  })

  it('n’envoie que le dernier ordre quand plusieurs déplacements s’enchaînent', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    const [bde, festival] = result.pages.value
    if (!bde || !festival) throw new Error('pages manquantes')

    const first = result.reorder([festival, bde])
    const second = result.reorder([bde, festival])
    const third = result.reorder([festival, bde])
    await Promise.all([first, second, third])

    // Le premier part tout de suite ; les deux suivants n'en font qu'un, avec l'ordre final
    expect(sentOrders).toEqual([['/api/pages/2', '/api/pages/1']])
    expect(titles(result)).toEqual(['Festival', 'BDE'])
  })

  it('un ordre refusé remet les pages dans l’ordre enregistré et garde l’erreur', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    orderFails = true

    await result.reorder([...result.pages.value].reverse())

    expect(result.orderStatus.value).toBe('error')
    expect((result.orderError.value as Error).message).toBe('Ordre refusé.')
    expect(titles(result)).toEqual(['BDE', 'Festival'])
  })

  it('ajoute la page créée en fin de liste et retire la page supprimée', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w

    const created = await result.create({ intitule: 'Nouveau projet', description: null })
    expect(created.id).toBe('9')
    expect(titles(result)).toEqual(['BDE', 'Festival', 'Nouveau projet'])

    const bde = result.pages.value[0]
    if (!bde) throw new Error('page manquante')
    await result.remove(bde)
    expect(titles(result)).toEqual(['Festival', 'Nouveau projet'])

    // L'ordre enregistré suit : un déplacement ne renvoie pas la page supprimée
    await result.reorder([...result.pages.value].reverse())
    expect(sentOrders).toEqual([['/api/pages/9', '/api/pages/2']])
  })

  it('un déplacement en attente derrière un envoi refusé est signalé comme non enregistré', async () => {
    pages = [page(1, 'BDE'), page(2, 'Festival'), page(3, 'Fil Bleu')]
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    const [bde, festival, filBleu] = result.pages.value
    if (!bde || !festival || !filBleu) throw new Error('pages manquantes')
    orderFails = true
    let release!: () => void
    gate = new Promise((resolve) => (release = resolve))

    // Le premier envoi part et reste en cours ; le second déplacement attend derrière lui
    const first = result.reorder([festival, bde, filBleu])
    await tick()
    const second = result.reorder([festival, filBleu, bde])
    release()

    expect(await first).toBe(false)
    expect(await second).toBe(false)
    // L'erreur reste affichée : la tâche suivante, sans rien à envoyer, ne l'efface pas
    expect(result.orderStatus.value).toBe('error')
    expect(titles(result)).toEqual(['BDE', 'Festival', 'Fil Bleu'])
    expect(sentOrders).toHaveLength(1)
  })

  it('un nouvel envoi réussi efface l’erreur précédente', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    orderFails = true
    expect(await result.reorder([...result.pages.value].reverse())).toBe(false)

    orderFails = false
    expect(await result.reorder([...result.pages.value].reverse())).toBe(true)
    expect(result.orderStatus.value).toBe('saved')
  })

  it('une création refusée rend l’erreur et ne touche pas la liste', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    createError = new ApiError(422, 'L’intitulé est obligatoire.')

    await expect(result.create({ intitule: 'x', description: null })).rejects.toThrow(
      'L’intitulé est obligatoire.',
    )
    expect(titles(result)).toEqual(['BDE', 'Festival'])
  })

  it('une suppression refusée garde la page ; une page déjà supprimée (404) est retirée', async () => {
    const { wrapper: w, result } = await mountComposable()
    wrapper = w
    const [bde, festival] = result.pages.value
    if (!bde || !festival) throw new Error('pages manquantes')

    deleteError = new ApiError(500, 'Le serveur a rencontré une erreur.')
    await expect(result.remove(bde)).rejects.toThrow('Le serveur a rencontré une erreur.')
    expect(titles(result)).toEqual(['BDE', 'Festival'])

    deleteError = new ApiError(404, 'Ressource introuvable.')
    await result.remove(festival)
    expect(titles(result)).toEqual(['BDE'])
  })
})
