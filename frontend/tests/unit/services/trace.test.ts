import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTrace, updateTrace } from '../../../app/services/trace'

afterEach(() => vi.unstubAllGlobals())

describe('services des traces', () => {
  it('crée une trace par un POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ '@id': '/api/traces/9' })
    vi.stubGlobal('$fetch', fetchMock)

    await createTrace({ titre: 'A' } as never)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/traces',
      expect.objectContaining({ method: 'POST', body: { titre: 'A' } }),
    )
  })

  it('modifie une trace par un PATCH au format merge-patch d’ApiPlatform', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ '@id': '/api/traces/3' })
    vi.stubGlobal('$fetch', fetchMock)

    await updateTrace(3, { titre: 'B' })

    const [path, options] = fetchMock.mock.calls[0] ?? []
    expect(path).toBe('/api/traces/3')
    expect(options.method).toBe('PATCH')
    expect(new Headers(options.headers).get('content-type')).toBe('application/merge-patch+json')
  })
})
