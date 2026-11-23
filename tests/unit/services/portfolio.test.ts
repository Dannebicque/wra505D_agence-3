import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPage,
  deletePage,
  listPages,
  updatePage,
  updatePageOrder,
} from '../../../app/services/portfolio'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(response: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('$fetch', fetchMock)
  return fetchMock
}

const contentType = (options: { headers?: HeadersInit }) =>
  new Headers(options.headers).get('content-type')

describe('services des portfolios et des pages-projets', () => {
  it('liste les pages d’un portfolio par le filtre `portfolio`, en suivant la pagination', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        member: [{ '@id': '/api/pages/1' }],
        view: { next: '/api/pages?portfolio=%2Fapi%2Fportfolios%2F1&page=2' },
      })
      .mockResolvedValueOnce({ member: [{ '@id': '/api/pages/2' }] })
    vi.stubGlobal('$fetch', fetchMock)

    const pages = await listPages('/api/portfolios/1')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/pages?portfolio=%2Fapi%2Fportfolios%2F1')
    expect(pages.map((p) => p['@id'])).toEqual(['/api/pages/1', '/api/pages/2'])
  })

  it('enregistre l’ordre des pages par un PATCH merge-patch du portfolio', async () => {
    const fetchMock = stubFetch()

    await updatePageOrder(1, ['/api/pages/2', '/api/pages/1'])

    const [path, options] = fetchMock.mock.calls[0] ?? []
    expect(path).toBe('/api/portfolios/1')
    expect(options).toMatchObject({
      method: 'PATCH',
      body: { pages: ['/api/pages/2', '/api/pages/1'] },
    })
    expect(contentType(options)).toBe('application/merge-patch+json')
  })

  it('crée une page rattachée à son portfolio', async () => {
    const fetchMock = stubFetch()

    await createPage('/api/portfolios/1', { intitule: 'Projet', description: null })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pages',
      expect.objectContaining({
        method: 'POST',
        body: { portfolio: '/api/portfolios/1', intitule: 'Projet', description: null },
      }),
    )
  })

  it('modifie les traces d’une page par un PATCH merge-patch', async () => {
    const fetchMock = stubFetch()

    await updatePage(3, { traces: ['/api/traces/4'] })

    const [path, options] = fetchMock.mock.calls[0] ?? []
    expect(path).toBe('/api/pages/3')
    expect(options).toMatchObject({ method: 'PATCH', body: { traces: ['/api/traces/4'] } })
    expect(contentType(options)).toBe('application/merge-patch+json')
  })

  it('supprime une page par un DELETE', async () => {
    const fetchMock = stubFetch(null)

    await deletePage(3)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pages/3',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
