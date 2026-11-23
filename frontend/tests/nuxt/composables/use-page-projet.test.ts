import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { Iri } from '#shared/types/api'
import type { Page, PageInfo } from '#shared/types/portfolio'
import { usePageProjet } from '~/composables/usePageProjet'
import { ApiError } from '~/services/errors'

const collection = (path: string, member: unknown[]) => ({
  '@id': path,
  '@type': 'Collection',
  totalItems: member.length,
  member,
})

const page = (id: number, portfolio: number, traces: number[]): Page => ({
  '@id': `/api/pages/${id}`,
  '@type': 'Page',
  portfolio: `/api/portfolios/${portfolio}`,
  intitule: `Projet ${id}`,
  description: null,
  traces: traces.map((t) => `/api/traces/${t}` as Iri),
  dateSuppression: null,
})

const trace = (
  id: number,
  statut: 'brouillon' | 'finalisee',
  dateSuppression: string | null = null,
) => ({
  '@id': `/api/traces/${id}`,
  '@type': 'Trace',
  titre: `Trace ${id}`,
  type: 'lien',
  statut,
  dateCreation: '2026-10-01',
  dateModification: null,
  dateSuppression,
})

// Page 1 : traces 1 et 2 ; page 2 du même portfolio : trace 3. Trace 4 libre, 5 en brouillon.
registerEndpoint('/api/pages/1', () => page(1, 1, [1, 2]))
registerEndpoint('/api/pages/7', () => page(7, 2, []))
registerEndpoint('/api/portfolios/1', () => ({
  '@id': '/api/portfolios/1',
  intitule: 'Mon portfolio',
}))
registerEndpoint('/api/pages', () =>
  collection('/api/pages', [page(1, 1, [1, 2]), page(2, 1, [3])]),
)
registerEndpoint('/api/traces', () =>
  collection('/api/traces', [
    trace(1, 'finalisee'),
    trace(2, 'finalisee'),
    trace(3, 'finalisee'),
    trace(4, 'finalisee'),
    trace(5, 'brouillon'),
    trace(6, 'finalisee', '2026-10-20'),
  ]),
)
registerEndpoint('/api/validations', () => collection('/api/validations', []))
registerEndpoint('/api/referentiels', () => collection('/api/referentiels', []))

let tracesFail = false
const sentTraces: Iri[][] = []

type Result = Awaited<ReturnType<typeof usePageProjet>>

/** Retient l'envoi en cours tant qu'elle n'est pas résolue (envoi « lent »). */
let gate: Promise<void> | null = null
const tick = () => new Promise((resolve) => setTimeout(resolve))

async function mountComposable(pageId = '1') {
  let result!: Result
  const wrapper = await mountSuspended(
    defineComponent({
      async setup() {
        const store = usePortfolioStore()
        vi.spyOn(store, 'updatePage').mockImplementation(
          async (_id: string, changes: Partial<PageInfo & Pick<Page, 'traces'>>) => {
            if (changes.traces) {
              sentTraces.push(changes.traces)
              if (gate) await gate
              if (tracesFail) throw new ApiError(422, 'Trace introuvable.')
            }
            return { ...page(1, 1, []), ...changes }
          },
        )
        result = await usePageProjet('1', pageId)
        return () => h('div')
      },
    }),
  )
  await vi.waitFor(() => expect(result.status.value).not.toBe('pending'))
  return { wrapper, result }
}

const titles = (result: Result) => result.traces.value.map((item) => item.trace.titre)

describe('usePageProjet', () => {
  let wrapper: { unmount(): void } | undefined

  afterEach(() => {
    wrapper?.unmount()
    tracesFail = false
    gate = null
    sentTraces.length = 0
  })

  it('propose les seules traces finalisées absentes de toutes les pages du portfolio', async () => {
    const mounted = await mountComposable()
    wrapper = mounted.wrapper
    const { result } = mounted

    expect(result.status.value).toBe('success')
    expect(titles(result)).toEqual(['Trace 1', 'Trace 2'])
    // Trace 3 : autre page ; 5 : brouillon ; 6 : corbeille
    expect(result.available.value.map((item) => item.trace.titre)).toEqual(['Trace 4'])
    expect(result.usedElsewhereCount.value).toBe(1)
  })

  it('enregistre l’ajout, l’ordre et le retrait des traces', async () => {
    const mounted = await mountComposable()
    wrapper = mounted.wrapper
    const { result } = mounted

    await result.addTraces(['/api/traces/4'])
    expect(titles(result)).toEqual(['Trace 1', 'Trace 2', 'Trace 4'])

    await result.reorderTraces([...result.traces.value].reverse())
    await result.removeTrace('/api/traces/2')

    expect(sentTraces).toEqual([
      ['/api/traces/1', '/api/traces/2', '/api/traces/4'],
      ['/api/traces/4', '/api/traces/2', '/api/traces/1'],
      ['/api/traces/4', '/api/traces/1'],
    ])
    expect(result.tracesStatus.value).toBe('saved')
  })

  it('un enregistrement refusé remet les traces telles qu’enregistrées', async () => {
    const mounted = await mountComposable()
    wrapper = mounted.wrapper
    const { result } = mounted
    tracesFail = true

    await result.addTraces(['/api/traces/4'])

    expect(result.tracesStatus.value).toBe('error')
    expect((result.tracesError.value as Error).message).toBe('Trace introuvable.')
    expect(titles(result)).toEqual(['Trace 1', 'Trace 2'])
  })

  it('une page d’un autre portfolio est introuvable (404)', async () => {
    const mounted = await mountComposable('7')
    wrapper = mounted.wrapper

    expect(mounted.result.status.value).toBe('error')
    expect((mounted.result.error.value as { statusCode?: number }).statusCode).toBe(404)
  })

  it('un retrait en attente derrière un ajout refusé est signalé comme non enregistré', async () => {
    const mounted = await mountComposable()
    wrapper = mounted.wrapper
    const { result } = mounted
    tracesFail = true
    let release!: () => void
    gate = new Promise((resolve) => (release = resolve))

    // L'ajout part et reste en cours ; le retrait attend derrière lui
    const adding = result.addTraces(['/api/traces/4'])
    await tick()
    const removing = result.removeTrace('/api/traces/2')
    release()

    expect(await adding).toBe(false)
    expect(await removing).toBe(false)
    expect(result.tracesStatus.value).toBe('error')
    // L'ajout refusé a remis la page en état : le retrait attendu n'a pas eu lieu
    expect(titles(result)).toEqual(['Trace 1', 'Trace 2'])
  })
})
