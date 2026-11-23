import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Iri } from '#shared/types/api'
import type { Page } from '#shared/types/portfolio'
import PagePortfolio from '~/pages/etudiant/portfolios/[id]/index.vue'
import PageProjet from '~/pages/etudiant/portfolios/[id]/pages/[pageId].vue'
import { ApiError } from '~/services/errors'

// Écrans branchés des pages-projets : réactions aux échecs de l'API (le store est simulé en échec)

const collection = (path: string, member: unknown[]) => ({
  '@id': path,
  '@type': 'Collection',
  totalItems: member.length,
  member,
})

const page = (id: number, intitule: string, traces: number[] = []): Page => ({
  '@id': `/api/pages/${id}`,
  '@type': 'Page',
  portfolio: '/api/portfolios/1',
  intitule,
  description: null,
  traces: traces.map((t) => `/api/traces/${t}` as Iri),
  dateSuppression: null,
})

const trace = (id: number) => ({
  '@id': `/api/traces/${id}`,
  '@type': 'Trace',
  titre: `Trace ${id}`,
  type: 'lien',
  statut: 'finalisee',
  dateCreation: '2026-10-01',
  dateModification: null,
  dateSuppression: null,
})

registerEndpoint('/api/pages', () =>
  collection('/api/pages', [page(1, 'BDE', [1]), page(2, 'Festival')]),
)
registerEndpoint('/api/pages/1', () => page(1, 'BDE', [1]))
registerEndpoint('/api/portfolios/1', () => ({
  '@id': '/api/portfolios/1',
  intitule: 'Mon portfolio',
}))
registerEndpoint('/api/traces', () => collection('/api/traces', [trace(1), trace(2), trace(3)]))
registerEndpoint('/api/validations', () => collection('/api/validations', []))
registerEndpoint('/api/referentiels', () => collection('/api/referentiels', []))

const store = () => usePortfolioStore(useNuxtApp().$pinia)
type Wrapper = VueWrapper

const button = (wrapper: Wrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text().trim() === text)
const byLabel = (wrapper: Wrapper, label: string) => wrapper.get(`button[aria-label="${label}"]`)

describe('écran du portfolio : pages-projets', () => {
  let wrapper: Wrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('« Annuler » est inactif pendant la création d’une page', async () => {
    let release!: () => void
    vi.spyOn(store(), 'createPage').mockImplementation(
      () => new Promise((resolve) => (release = () => resolve(page(9, 'Nouveau projet')))),
    )
    wrapper = await mountSuspended(PagePortfolio, {
      route: '/etudiant/portfolios/1',
      attachTo: document.body,
    })
    await vi.waitFor(() => expect(wrapper?.text()).toContain('Festival'))

    await button(wrapper, 'Ajouter une page')?.trigger('click')
    const addForm = wrapper
      .findAll('form')
      .find((f) => f.text().includes('Intitulé de la nouvelle page'))
    if (!addForm) throw new Error('formulaire d’ajout absent')
    await addForm.get('input').setValue('Nouveau projet')
    await addForm.trigger('submit')
    await flushPromises()

    const cancel = wrapper.findAll('button').find((b) => b.text() === 'Annuler')
    expect(cancel?.attributes('disabled')).toBeDefined()

    release()
    await vi.waitFor(() => expect(wrapper?.text()).toContain('Nouveau projet'))
  })

  it('affiche ensemble l’échec d’une suppression et celui de l’ordre, puis efface le premier', async () => {
    vi.spyOn(store(), 'deletePage').mockRejectedValue(new ApiError(500, 'Panne du serveur.'))
    const order = vi
      .spyOn(store(), 'setPageOrder')
      .mockRejectedValueOnce(new ApiError(422, 'Ordre refusé.'))
    wrapper = await mountSuspended(PagePortfolio, {
      route: '/etudiant/portfolios/1',
      attachTo: document.body,
    })
    await vi.waitFor(() => expect(wrapper?.text()).toContain('Festival'))
    const alertZone = () => wrapper!.get('section[aria-labelledby="pages-projets"] [role="alert"]')

    // Suppression refusée
    await byLabel(wrapper, 'Supprimer la page « Festival »').trigger('click')
    await flushPromises()
    const confirm = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Supprimer la page',
    )
    confirm?.click()
    await vi.waitFor(() =>
      expect(alertZone().text()).toContain('La page « Festival » n’a pas été supprimée'),
    )

    // Déplacement refusé : la suppression refusée est effacée par cette nouvelle action
    await byLabel(wrapper, 'Descendre « BDE »').trigger('click')
    await vi.waitFor(() => expect(alertZone().text()).toContain('Ordre refusé.'))
    expect(alertZone().text()).not.toContain('n’a pas été supprimée')
    expect(order).toHaveBeenCalledTimes(1)
  })
})

describe('écran d’une page-projet', () => {
  let wrapper: Wrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const mountPage = async () => {
    wrapper = await mountSuspended(PageProjet, {
      route: '/etudiant/portfolios/1/pages/1',
      attachTo: document.body,
    })
    await vi.waitFor(() => expect(wrapper?.text()).toContain('Traces disponibles'))
    return wrapper
  }

  it('un refus sans champ précis s’affiche dans l’alerte du formulaire', async () => {
    vi.spyOn(store(), 'updatePage').mockRejectedValue(
      new ApiError(422, 'Page invalide.', [{ propertyPath: '', message: 'Page invalide.' }]),
    )
    const w = await mountPage()

    await w.get('form').trigger('submit')
    await vi.waitFor(() =>
      expect(w.get('section[aria-labelledby="informations"] [role="alert"]').text()).toBe(
        'La page n’a pas été enregistrée : Page invalide.',
      ),
    )
  })

  it('après un ajout refusé, les traces restent cochées et l’erreur est expliquée', async () => {
    vi.spyOn(store(), 'updatePage').mockRejectedValue(new ApiError(422, 'Trace introuvable.'))
    const w = await mountPage()

    const checkbox = w.get('[role="checkbox"]')
    await checkbox.trigger('click')
    expect(checkbox.attributes('aria-checked')).toBe('true')
    await w.get('aside form').trigger('submit')

    await vi.waitFor(() =>
      expect(w.get('section[aria-labelledby="traces-de-la-page"] [role="alert"]').text()).toContain(
        'Trace introuvable.',
      ),
    )
    expect(w.get('[role="checkbox"]').attributes('aria-checked')).toBe('true')
    expect(button(w, 'Ajouter la sélection (1)')).toBeDefined()
  })
})
