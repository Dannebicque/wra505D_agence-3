import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import EspaceLayout from '~/layouts/espace.vue'

const slots = { default: () => h('p', 'Contenu de la page') }

describe('outils de la mise en page des espaces', () => {
  it('propose la recherche (avec son raccourci) et l’aide dans chaque espace', async () => {
    const layout = await mountSuspended(EspaceLayout, { route: '/admin', slots })

    const recherche = layout.get('button[aria-keyshortcuts]')
    expect(recherche.text()).toContain('Rechercher')
    expect(recherche.attributes('aria-keyshortcuts')).toContain('Control+K')
    expect(layout.findAll('button').some((b) => b.text().includes('Aide'))).toBe(true)
  })

  it('signale les notifications non lues de l’étudiant et mène à ses retours', async () => {
    const layout = await mountSuspended(EspaceLayout, { route: '/etudiant', slots })

    const cloche = layout.get('a[href="/etudiant/retours"]')
    expect(cloche.attributes('aria-label')).toBe('Notifications, 2 non lues')
  })

  it('n’affiche pas la cloche hors de l’espace étudiant', async () => {
    const layout = await mountSuspended(EspaceLayout, { route: '/enseignant', slots })

    expect(layout.find('a[href="/etudiant/retours"]').exists()).toBe(false)
  })
})
