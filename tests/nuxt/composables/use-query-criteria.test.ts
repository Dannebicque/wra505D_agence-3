import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { TRACE_FILTER_OPTIONS } from '~/demo/enseignant'
import type { TraceCriteria } from '~/utils/trace-filters'

async function mountCriteria(route: string) {
  let criteria: TraceCriteria | undefined
  await mountSuspended(
    defineComponent({
      setup() {
        criteria = useQueryCriteria(
          (query) => criteriaFromQuery(query, TRACE_FILTER_OPTIONS),
          criteriaToQuery,
        )
        return () => h('div')
      },
    }),
    { route },
  )
  if (!criteria) throw new Error('critères non initialisés')
  return criteria
}

describe('useQueryCriteria', () => {
  it('lit les critères dans l’URL, puis réécrit l’URL quand ils changent', async () => {
    const router = useRouter()
    const criteria = await mountCriteria('/?statut=evaluees&etudiant=999')

    // Étudiant inconnu : « tous »
    expect(criteria).toMatchObject({ statut: 'evaluees', etudiant: ALL })

    criteria.recherche = 'api'
    // La navigation du routeur est asynchrone
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({ statut: 'evaluees', recherche: 'api' }),
    )
  })

  it('suit l’URL quand elle change (lien du menu, retour arrière)', async () => {
    const router = useRouter()
    const criteria = await mountCriteria('/?competence=4')
    expect(criteria.competence).toBe('4')

    await router.replace({ path: '/', query: {} })
    await flushPromises()
    expect(criteria).toEqual(DEFAULT_CRITERIA)
    expect(router.currentRoute.value.query).toEqual({})
  })
})
