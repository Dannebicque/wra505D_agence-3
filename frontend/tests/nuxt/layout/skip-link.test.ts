import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import SkipLink from '~/components/layout/SkipLink.vue'

describe('lien d’évitement', () => {
  it('mène au contenu principal', async () => {
    const lien = await mountSuspended(SkipLink)

    expect(lien.get('a').text()).toBe('Aller au contenu')
    expect(lien.get('a').attributes('href')).toBe('#contenu')
  })
})
