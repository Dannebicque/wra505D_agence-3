import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createAutosave } from '../../app/utils/autosave'

const DELAY = 1500

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/** Laisse passer le délai, puis les promesses de l'enregistrement. */
async function elapse(ms = DELAY) {
  await vi.advanceTimersByTimeAsync(ms)
}

function setup(
  options: {
    valid?: () => boolean
    enabled?: () => boolean
    save?: (value: string) => Promise<void>
  } = {},
) {
  const value = ref('départ')
  const save = vi.fn(options.save ?? (async () => {}))
  const autosave = createAutosave(() => value.value, {
    save,
    isValid: options.valid ?? (() => true),
    isEnabled: options.enabled,
    delay: DELAY,
    now: () => new Date('2026-11-03T13:32:00Z'),
  })
  return { value, save, autosave }
}

describe('sauvegarde automatique', () => {
  it('n’enregistre rien tant que rien ne change', async () => {
    const { save, autosave } = setup()

    await elapse(5000)

    expect(save).not.toHaveBeenCalled()
    expect(autosave.status.value).toBe('idle')
  })

  it('enregistre une seule fois, après le délai suivant la dernière modification', async () => {
    const { value, save, autosave } = setup()

    value.value = 'a'
    await nextTick()
    await elapse(1000)
    value.value = 'ab'
    await nextTick()
    expect(autosave.status.value).toBe('pending')
    await elapse(1000)
    expect(save).not.toHaveBeenCalled()

    await elapse(500)

    expect(save).toHaveBeenCalledExactlyOnceWith('ab')
    expect(autosave.status.value).toBe('saved')
    expect(autosave.lastSavedAt.value).toEqual(new Date('2026-11-03T13:32:00Z'))
    expect(autosave.hasUnsavedChanges.value).toBe(false)
  })

  it('n’enregistre pas une saisie invalide et le signale', async () => {
    const { value, save, autosave } = setup({ valid: () => false })

    value.value = 'a'
    await nextTick()
    await elapse()

    expect(save).not.toHaveBeenCalled()
    expect(autosave.status.value).toBe('invalid')
    expect(autosave.hasUnsavedChanges.value).toBe(true)
  })

  it('signale un échec et réessaie à la modification suivante', async () => {
    let fail = true
    const { value, save, autosave } = setup({
      save: async () => {
        if (fail) throw new Error('réseau')
      },
    })

    value.value = 'a'
    await nextTick()
    await elapse()
    expect(autosave.status.value).toBe('error')
    expect(autosave.hasUnsavedChanges.value).toBe(true)

    fail = false
    value.value = 'ab'
    await nextTick()
    await elapse()

    expect(save).toHaveBeenLastCalledWith('ab')
    expect(autosave.status.value).toBe('saved')
  })

  it('enregistre à nouveau la dernière valeur si elle change pendant un enregistrement', async () => {
    let release: () => void = () => {}
    const { value, save } = setup({
      save: () => new Promise<void>((resolve) => (release = resolve)),
    })

    value.value = 'a'
    await nextTick()
    await elapse()
    expect(save).toHaveBeenCalledTimes(1)

    value.value = 'abc'
    await nextTick()
    await elapse()
    expect(save).toHaveBeenCalledTimes(1) // un seul enregistrement à la fois

    release()
    await elapse()

    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('abc')
  })

  it('enregistre immédiatement sur demande (avant de quitter la page)', async () => {
    const { value, save, autosave } = setup()

    value.value = 'a'
    await nextTick()
    await autosave.flush()

    expect(save).toHaveBeenCalledExactlyOnceWith('a')
    await elapse()
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('s’arrête quand on le lui demande', async () => {
    const { value, save, autosave } = setup()

    autosave.stop()
    value.value = 'a'
    await nextTick()
    await elapse()

    expect(save).not.toHaveBeenCalled()
  })

  // Pendant un enregistrement explicite (« Finaliser ») : pas d'envoi concurrent (doublon de création)
  it('attend tant qu’il est mis en pause, sans perdre la modification', async () => {
    let enabled = false
    const { value, save, autosave } = setup({ enabled: () => enabled })

    value.value = 'a'
    await nextTick()
    await elapse()
    expect(save).not.toHaveBeenCalled()
    expect(autosave.hasUnsavedChanges.value).toBe(true)

    enabled = true
    await autosave.flush()
    expect(save).toHaveBeenCalledExactlyOnceWith('a')
  })
})
