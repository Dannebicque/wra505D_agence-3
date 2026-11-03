import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

describe('useStatusMessage', () => {
  it('vide la zone avant de réécrire un message, même identique', async () => {
    const { message, announce } = useStatusMessage()
    const seen: string[] = []
    const stop = watch(message, (value) => seen.push(value), { flush: 'sync' })

    await announce('Langue ajoutée.')
    await announce('Langue ajoutée.')
    await nextTick()
    stop()

    expect(message.value).toBe('Langue ajoutée.')
    expect(seen).toEqual(['Langue ajoutée.', '', 'Langue ajoutée.'])
  })
})
