import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('useStatusMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('vide la zone, puis réécrit le message dans une tâche suivante, même identique', async () => {
    const { message, announce } = useStatusMessage()
    const seen: string[] = []
    const stop = watch(message, (value) => seen.push(value), { flush: 'sync' })

    const first = announce('Langue ajoutée.')
    // Rien n'est réécrit dans la même tâche
    expect(message.value).toBe('')
    await vi.runAllTimersAsync()
    await first

    const second = announce('Langue ajoutée.')
    expect(message.value).toBe('')
    await vi.runAllTimersAsync()
    await second
    stop()

    expect(seen).toEqual(['Langue ajoutée.', '', 'Langue ajoutée.'])
  })

  it('n’écrit que le dernier message quand deux appels se suivent de près', async () => {
    const { message, announce } = useStatusMessage()

    const replaced = announce('Expérience ajoutée.')
    const last = announce('Expérience supprimée.')
    await vi.runAllTimersAsync()
    // L'appel remplacé se termine aussi, sans écrire son message
    await Promise.all([replaced, last])

    expect(message.value).toBe('Expérience supprimée.')
  })

  it('clear efface le message et annule l’annonce en attente', async () => {
    const { message, announce, clear } = useStatusMessage()
    await vi.runAllTimersAsync()
    void announce('Page enregistrée.')
    await vi.runAllTimersAsync()
    expect(message.value).toBe('Page enregistrée.')

    const pending = announce('Autre message.')
    clear()
    await vi.runAllTimersAsync()
    await pending

    expect(message.value).toBe('')
  })
})
