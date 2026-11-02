import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import AsyncState from '~/components/ui/AsyncState.vue'
import { ApiError } from '~/services/errors'

const slots = { default: () => h('p', 'Contenu chargé') }

describe('AsyncState', () => {
  it('annonce le chargement aux lecteurs d’écran', async () => {
    const wrapper = await mountSuspended(AsyncState, { props: { status: 'pending' }, slots })

    expect(wrapper.get('[role="status"]').text()).toContain('Chargement')
    expect(wrapper.text()).not.toContain('Contenu chargé')
  })

  it('affiche le message de l’erreur et propose de réessayer', async () => {
    const wrapper = await mountSuspended(AsyncState, {
      props: { status: 'error', error: new ApiError(0, 'Impossible de joindre le serveur.') },
      slots,
    })

    expect(wrapper.text()).toContain('Impossible de joindre le serveur.')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('affiche le message de vide au lieu du contenu', async () => {
    const wrapper = await mountSuspended(AsyncState, {
      props: { status: 'success', empty: true, emptyMessage: 'Aucune trace pour l’instant.' },
      slots,
    })

    expect(wrapper.text()).toContain('Aucune trace pour l’instant.')
    expect(wrapper.text()).not.toContain('Contenu chargé')
  })

  it('affiche le contenu une fois chargé', async () => {
    const wrapper = await mountSuspended(AsyncState, { props: { status: 'success' }, slots })

    expect(wrapper.text()).toContain('Contenu chargé')
  })
})
