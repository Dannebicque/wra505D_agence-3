import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '#shared/types/utilisateur'
import IndexPage from '~/pages/index.vue'

const ENSEIGNANTE: User = {
  '@id': '/api/users/2',
  '@type': 'User',
  username: 'enseignant',
  email: null,
  roles: ['ROLE_ENSEIGNANT'],
  etudiant: null,
  enseignant: '/api/enseignants/1',
}

// Connexions reçues par le faux serveur
let connexions = 0
let isConnecte = false
registerEndpoint('/api/login', {
  method: 'POST',
  handler: () => {
    connexions++
    isConnecte = true
    return null
  },
})
registerEndpoint('/api/me', () => {
  if (!isConnecte) throw createError({ statusCode: 401 })
  return ENSEIGNANTE
})
registerEndpoint('/api/enseignants/1', () => ({ prenom: 'Sophie', nom: 'Durand' }))

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

  it('connecte au compte de démonstration de l’espace choisi, puis y mène', async () => {
    const page = await mountSuspended(IndexPage)

    const demo = page.get('#demo')
    const boutons = demo.findAll('button')
    expect(boutons.map((bouton) => bouton.attributes('aria-label'))).toEqual([
      expect.stringContaining('Espace étudiant'),
      expect.stringContaining('Espace enseignant'),
      expect.stringContaining('Administration'),
    ])

    await boutons[1]!.trigger('click')
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/enseignant'))
    expect(connexions).toBe(1)
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
