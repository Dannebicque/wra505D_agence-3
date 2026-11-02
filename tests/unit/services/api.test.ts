import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, setApiBase } from '../../../app/services/api'
import { ApiError } from '../../../app/services/errors'

// Projet `unit` : aucun contexte Nuxt, comme après un `await` pendant le rendu serveur.
// `$fetch` est remplacé pour observer la requête que construit `apiFetch`.

afterEach(() => {
  vi.unstubAllGlobals()
  setApiBase('')
})

describe('apiFetch', () => {
  it('fonctionne sans contexte Nuxt et appelle l’origine configurée', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ '@id': '/api/referentiels/1' })
    vi.stubGlobal('$fetch', fetchMock)
    setApiBase('https://api.exemple.fr')

    await expect(apiFetch('/api/referentiels/1')).resolves.toEqual({
      '@id': '/api/referentiels/1',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/referentiels/1',
      expect.objectContaining({ baseURL: 'https://api.exemple.fr' }),
    )
  })

  it('demande du JSON-LD sans perdre les en-têtes de l’appelant', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)

    await apiFetch('/api/traces', { headers: { Authorization: 'Bearer jeton' } })

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('accept')).toBe('application/ld+json')
    expect(headers.get('authorization')).toBe('Bearer jeton')
  })

  it('garde l’en-tête Accept choisi par l’appelant', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)

    await apiFetch('/api/traces', { headers: { Accept: 'application/json' } })

    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('accept')).toBe(
      'application/json',
    )
  })

  it('transforme une erreur de requête en ApiError avec un message français', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockRejectedValue({ statusCode: 500, data: { message: 'stack trace' } }),
    )

    const error = await apiFetch('/api/referentiels').catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 500,
      message: 'Le serveur a rencontré une erreur. Réessayez plus tard.',
    })
  })
})
