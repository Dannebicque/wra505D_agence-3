import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import MesTraces from '~/pages/etudiant/traces/index.vue'

const collection = (path: string, member: unknown[]) => ({
  '@id': path,
  '@type': 'Collection',
  totalItems: member.length,
  member,
})

const TRACE = {
  '@id': '/api/traces/1',
  '@type': 'Trace',
  titre: 'Affiche du festival',
  type: 'image',
  statut: 'finalisee',
  description: null,
  contexte: null,
  dateCreation: '2026-10-01',
  dateModification: null,
  dateSuppression: null,
}

// Réponses modifiées par chaque test
let traces: unknown[] = []
let validationsFail = false

registerEndpoint('/api/traces', () => collection('/api/traces', traces))
registerEndpoint('/api/validations', () => {
  if (validationsFail) throw createError({ statusCode: 500 })
  return collection('/api/validations', [])
})
registerEndpoint('/api/referentiels', () => collection('/api/referentiels', []))

const mountPage = () => mountSuspended(MesTraces)

describe('page Mes traces', () => {
  let wrapper: Awaited<ReturnType<typeof mountPage>> | undefined

  afterEach(() => {
    wrapper?.unmount()
    traces = []
    validationsFail = false
  })

  it('sans aucune trace, invite à en déposer une et n’affiche pas les filtres', async () => {
    wrapper = await mountPage()

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain('Vous n’avez encore déposé aucune trace'),
    )
    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Aucune trace ne correspond')
  })

  it('avec des traces, affiche les filtres et le nombre de résultats', async () => {
    traces = [TRACE]
    wrapper = await mountPage()

    await vi.waitFor(() => expect(wrapper?.text()).toContain('Affiche du festival'))
    expect(wrapper.find('input[type="search"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"].text-sm').text()).toBe('1 trace')
  })

  it('signale l’erreur d’une source et retrouve la liste après « Réessayer »', async () => {
    traces = [TRACE]
    validationsFail = true
    wrapper = await mountPage()

    await vi.waitFor(() =>
      expect(wrapper?.text()).toContain('Impossible d’afficher ces informations'),
    )
    expect(wrapper.text()).not.toContain('Affiche du festival')

    validationsFail = false
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Réessayer')
    await retry?.trigger('click')

    await vi.waitFor(() => expect(wrapper?.text()).toContain('Affiche du festival'))
  })
})
