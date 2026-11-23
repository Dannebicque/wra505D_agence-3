import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('page d’accueil', () => {
  it('affiche le titre principal', async () => {
    const page = await mountSuspended(IndexPage)

    expect(page.get('h1').text()).toBe('UniFolio')
  })
})
