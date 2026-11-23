import { describe, expect, it } from 'vitest'
import { createSerialQueue } from '../../app/utils/serial-queue'

/** Promesse résolue à la demande, pour contrôler la fin d'un envoi. */
function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flush = () => new Promise((resolve) => setTimeout(resolve))

describe('createSerialQueue', () => {
  it('exécute les tâches une par une, dans l’ordre', async () => {
    const queue = createSerialQueue()
    const log: string[] = []
    const first = deferred()

    const a = queue.run(async () => {
      log.push('a:début')
      await first.promise
      log.push('a:fin')
    })
    const b = queue.run(async () => {
      log.push('b')
    })
    await flush()
    expect(log).toEqual(['a:début'])

    first.resolve()
    await Promise.all([a, b])
    expect(log).toEqual(['a:début', 'a:fin', 'b'])
  })

  it('rend l’échec à l’appelant sans bloquer la tâche suivante', async () => {
    const queue = createSerialQueue()

    const failing = queue.run(() => Promise.reject(new Error('refus')))
    const next = queue.run(() => Promise.resolve('ok'))

    await expect(failing).rejects.toThrow('refus')
    await expect(next).resolves.toBe('ok')
  })

  it('regroupe les appels de même clé en attente : un seul envoi, avec le dernier état', async () => {
    const queue = createSerialQueue()
    const sent: number[] = []
    let state = 0
    const inFlight = deferred()

    // Premier envoi en cours : les suivants attendent
    state = 1
    const first = queue.runLatest('ordre', async () => {
      sent.push(state)
      await inFlight.promise
    })
    await flush()
    state = 2
    const second = queue.runLatest('ordre', async () => void sent.push(state))
    state = 3
    const third = queue.runLatest('ordre', async () => void sent.push(state))

    expect(third).toBe(second)
    inFlight.resolve()
    await Promise.all([first, second])
    expect(sent).toEqual([1, 3])
  })

  it('une tâche de même clé déjà démarrée n’absorbe pas l’appel suivant', async () => {
    const queue = createSerialQueue()
    const inFlight = deferred()
    let runs = 0

    const first = queue.runLatest('ordre', async () => {
      runs++
      await inFlight.promise
    })
    await flush()
    const second = queue.runLatest('ordre', async () => void runs++)

    expect(second).not.toBe(first)
    inFlight.resolve()
    await second
    expect(runs).toBe(2)
  })

  it('idle se résout quand la file est vide, même après un échec', async () => {
    const queue = createSerialQueue()
    const done: string[] = []

    void queue.run(() => Promise.reject(new Error('refus'))).catch(() => undefined)
    void queue.run(async () => void done.push('b'))

    await queue.idle()
    expect(done).toEqual(['b'])
  })
})
