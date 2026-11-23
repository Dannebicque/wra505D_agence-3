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

  it('place le contenu de la page dans la zone principale ciblée par le lien d’évitement', async () => {
    const layout = await mountSuspended(EspaceLayout, {
      route: '/enseignant',
      slots: { default: () => h('p', 'Contenu de la page') },
    })

    expect(layout.get('main#contenu').text()).toContain('Contenu de la page')
    expect(layout.text()).toContain('UniFolio')
  })
})
