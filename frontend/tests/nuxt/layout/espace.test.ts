import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import EspaceLayout from '~/layouts/espace.vue'

describe('mise en page des espaces', () => {
  it('affiche la navigation de l’espace visité avec la page courante signalée', async () => {
    const layout = await mountSuspended(EspaceLayout, {
      route: '/etudiant',
      slots: { default: () => h('p', 'Contenu de la page') },
    })

    const nav = layout.get('nav[aria-label="Navigation de l’espace"]')
    const lien = nav.get('a[href="/etudiant"]')
    expect(lien.text()).toContain('Tableau de bord')
    expect(lien.attributes('aria-current')).toBe('page')
  })

  it('nomme chaque groupe de pages sans id (la barre est rendue deux fois) et range la corbeille en bas', async () => {
    const layout = await mountSuspended(EspaceLayout, {
      route: '/etudiant/traces/1',
      slots: { default: () => h('p', 'Contenu de la page') },
    })

    const nav = layout.get('nav[aria-label="Navigation de l’espace"]')
    const lists = nav.findAll('ul')
    expect(lists.map((l) => l.attributes('aria-label'))).toEqual([
      undefined,
      'Mon travail',
      'Mon suivi',
      undefined,
    ])
    expect(nav.findAll('[id]')).toHaveLength(0)
    expect(lists.at(-1)!.text()).toContain('Corbeille')
    // Sous-page de « Mes traces » : l'entrée est signalée, sans se dire la page affichée
    expect(nav.get('a[href="/etudiant/traces"]').attributes('aria-current')).toBe('true')
    expect(nav.get('a[href="/etudiant"]').attributes('aria-current')).toBeUndefined()
  })

  it('place le contenu de la page dans la zone principale ciblée par le lien d’évitement', async () => {
    const layout = await mountSuspended(EspaceLayout, {
      route: '/enseignant',
      slots: { default: () => h('p', 'Contenu de la page') },
    })

    expect(layout.get('main#contenu').text()).toContain('Contenu de la page')
    expect(layout.text()).toContain('UniFolio')
  })
})
