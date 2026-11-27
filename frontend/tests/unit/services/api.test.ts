import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiFetch,
  apiFetchAll,
  setApiBase,
  setUnauthorizedHandler,
} from '../../../app/services/api'
import { ApiError } from '../../../app/services/errors'

// Projet `unit` : aucun contexte Nuxt, comme après un `await` pendant le rendu serveur.
// `$fetch` est remplacé pour observer la requête que construit `apiFetch`.

afterEach(() => {
  vi.unstubAllGlobals()
  setApiBase('')
  setUnauthorizedHandler(null)
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

  // ApiPlatform pagine par 30 : un compteur calculé sur la première page serait faux
  it('lit toutes les pages d’une collection', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ member: [1, 2], view: { next: '/api/traces?page=2' } })
      .mockResolvedValueOnce({ member: [3], view: { previous: '/api/traces?page=1' } })
    vi.stubGlobal('$fetch', fetchMock)

    await expect(apiFetchAll('/api/traces')).resolves.toEqual([1, 2, 3])
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/traces',
      '/api/traces?page=2',
    ])
  })
})

describe('session expirée', () => {
  const unauthorized = () => vi.fn().mockRejectedValue({ statusCode: 401, data: {} })

  it('prévient le gestionnaire d’un 401, puis relance l’erreur', async () => {
    vi.stubGlobal('$fetch', unauthorized())
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await expect(apiFetch('/api/traces?page=2')).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledOnce()
  })

  it.each(['/api/me', '/api/login'])(
    'laisse le 401 de %s à l’appelant (réponse attendue de la connexion)',
    async (path) => {
      vi.stubGlobal('$fetch', unauthorized())
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      await expect(apiFetch(path)).rejects.toBeInstanceOf(ApiError)
      expect(handler).not.toHaveBeenCalled()
    },
  )

  it('ne prévient personne pour les autres erreurs', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue({ statusCode: 403, data: {} }))
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await expect(apiFetch('/api/traces')).rejects.toMatchObject({ status: 403 })
    expect(handler).not.toHaveBeenCalled()
  })
})
