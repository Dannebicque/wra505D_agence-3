import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('page d’accueil', () => {
  it('affiche un seul titre principal, sur deux lignes', async () => {
    const page = await mountSuspended(IndexPage)

    const titres = page.findAll('h1')
    expect(titres).toHaveLength(1)
    expect(titres[0]!.text()).toBe('Vos compétences, trace après trace.')
    expect(titres[0]!.findAll('.ligne')).toHaveLength(2)
  })

  it('nomme chaque section par son titre', async () => {
    const page = await mountSuspended(IndexPage)

    const sections = page.findAll('section')
    expect(sections.length).toBeGreaterThanOrEqual(5)
    for (const section of sections) {
      const id = section.attributes('aria-labelledby')
      expect(id).toBeTruthy()
      expect(page.find(`#${id}`).exists()).toBe(true)
    }
  })

  it('mène aux trois espaces de démonstration', async () => {
    const page = await mountSuspended(IndexPage)

    const demo = page.get('#demo')
    const hrefs = demo.findAll('a').map((lien) => lien.attributes('href'))
    expect(hrefs).toEqual(['/etudiant', '/enseignant', '/admin'])
  })
})

describe('aperçu de l’interface', () => {
  it('bascule de la vue étudiant à la vue enseignant', async () => {
    const page = await mountSuspended(IndexPage)
    const [etudiant, enseignant] = page.findAll('[aria-pressed]')

    expect(etudiant!.text()).toBe('Vue étudiant')
    expect(etudiant!.attributes('aria-pressed')).toBe('true')
    expect(enseignant!.attributes('aria-pressed')).toBe('false')

    await enseignant!.trigger('click')

    expect(enseignant!.attributes('aria-pressed')).toBe('true')
    expect(etudiant!.attributes('aria-pressed')).toBe('false')
    // La vue masquée sort de l'ordre de lecture et du clavier
    const vues = page.findAll('[inert]')
    expect(vues).toHaveLength(1)
    expect(vues[0]!.text()).toContain('Espace étudiant')
  })
})
