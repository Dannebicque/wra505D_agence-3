import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import LayoutNavGroup from '~/components/layout/NavGroup.vue'
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

  it('nomme chaque groupe de pages par son intitulé et range la corbeille en bas', async () => {
    const layout = await mountSuspended(EspaceLayout, {
      route: '/etudiant/traces/1',
      slots: { default: () => h('p', 'Contenu de la page') },
    })

    const nav = layout.get('nav[aria-label="Navigation de l’espace"]')
    const lists = nav.findAll('ul')
    // Chaque liste titrée est nommée par son intitulé visible (lu aussi par NVDA)
    const names = lists.map((list) => {
      const id = list.attributes('aria-labelledby')
      return id ? nav.get(`[id="${id}"]`).text() : undefined
    })
    expect(names).toEqual([undefined, 'Mon travail', 'Mon suivi', undefined])
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

  it('tire des ids distincts quand la barre est rendue deux fois (ordinateur et menu mobile)', async () => {
    const twice = defineComponent({
      setup: () => () => [
        h(LayoutNavGroup, { label: 'Mon travail' }),
        h(LayoutNavGroup, { label: 'Mon travail' }),
      ],
    })
    const wrapper = await mountSuspended(twice)
    const ids = wrapper.findAll('p[id]').map((p) => p.attributes('id'))
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})
