import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NotificationsLien from '~/components/commun/NotificationsLien.vue'

describe('NotificationsLien', () => {
  it('annonce le nombre de non-lus dans le nom du lien', async () => {
    const wrapper = await mountSuspended(NotificationsLien)

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/etudiant/retours')
    expect(link.attributes('aria-label')).toBe('Notifications, 2 non lues')
  })

  it('montre le nombre dans une pastille or au texte foncé, masquée aux lecteurs d’écran', async () => {
    const wrapper = await mountSuspended(NotificationsLien)

    const pastille = wrapper.get('a [aria-hidden="true"].bg-or-400')
    expect(pastille.classes()).toEqual(expect.arrayContaining(['text-prune-950', 'tabular-nums']))
    expect(pastille.text()).toBe('2')
  })
})
