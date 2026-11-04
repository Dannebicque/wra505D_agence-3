import { expect, test } from '@playwright/test'

const PAGES_DU_PORTFOLIO = `/api/pages?portfolio=${encodeURIComponent('/api/portfolios/1')}`

// Routes provisoires : chaque test a son propre contexte, donc son propre cookie de démo
test.describe('routes des pages-projets', () => {
  test('liste les pages d’un portfolio dans leur ordre', async ({ request }) => {
    const response = await request.get(PAGES_DU_PORTFOLIO)

    expect(response.status()).toBe(200)
    const { member } = await response.json()
    expect(member.map((p: { '@id': string }) => p['@id'])).toEqual([
      '/api/pages/1',
      '/api/pages/2',
      '/api/pages/6',
    ])
  })

  test('garde le nouvel ordre des pages au rechargement', async ({ request }) => {
    const pages = ['/api/pages/6', '/api/pages/1', '/api/pages/2']

    const patch = await request.patch('/api/portfolios/1', {
      data: { pages },
      headers: { 'Content-Type': 'application/merge-patch+json' },
    })
    expect(patch.status()).toBe(200)

    const portfolio = await (await request.get('/api/portfolios/1')).json()
    expect(portfolio.pages).toEqual(pages)
  })

  test('refuse un ordre qui ne reprend pas les pages du portfolio', async ({ request }) => {
    const response = await request.patch('/api/portfolios/1', {
      data: { pages: ['/api/pages/1'] },
      headers: { 'Content-Type': 'application/merge-patch+json' },
    })

    expect(response.status()).toBe(422)
    expect((await response.json()).data.violations[0].propertyPath).toBe('pages')
  })

  test('crée, modifie puis supprime une page', async ({ request }) => {
    const created = await request.post('/api/pages', {
      data: { portfolio: '/api/portfolios/1', intitule: '  Nouveau projet ', description: '' },
    })
    expect(created.status()).toBe(201)
    const page = await created.json()
    expect(page).toMatchObject({ intitule: 'Nouveau projet', description: null, traces: [] })

    const updated = await request.patch(page['@id'], {
      data: { description: 'Un projet', traces: ['/api/traces/4'] },
      headers: { 'Content-Type': 'application/merge-patch+json' },
    })
    expect(updated.status()).toBe(200)
    expect(await updated.json()).toMatchObject({
      intitule: 'Nouveau projet',
      description: 'Un projet',
      traces: ['/api/traces/4'],
    })

    const deleted = await request.delete(page['@id'])
    expect(deleted.status()).toBe(204)
    expect((await request.get(page['@id'])).status()).toBe(404)
    const portfolio = await (await request.get('/api/portfolios/1')).json()
    expect(portfolio.pages).not.toContain(page['@id'])
  })

  test('refuse une page sans intitulé ou rattachée à un portfolio inconnu', async ({ request }) => {
    const sansIntitule = await request.post('/api/pages', {
      data: { portfolio: '/api/portfolios/1', intitule: ' ' },
    })
    const sansPortfolio = await request.post('/api/pages', {
      data: { portfolio: '/api/portfolios/999', intitule: 'Projet' },
    })

    expect(sansIntitule.status()).toBe(422)
    expect(sansPortfolio.status()).toBe(422)
  })

  test('refuse une trace déjà présente dans une autre page du portfolio', async ({ request }) => {
    const response = await request.patch('/api/pages/2', {
      data: { traces: ['/api/traces/2', '/api/traces/1'] },
      headers: { 'Content-Type': 'application/merge-patch+json' },
    })

    expect(response.status()).toBe(422)
    expect((await response.json()).data.violations[0].propertyPath).toBe('traces')
  })

  test('répond 404 pour une ressource inconnue', async ({ request }) => {
    expect((await request.get('/api/portfolios/999')).status()).toBe(404)
    expect((await request.get('/api/pages/999')).status()).toBe(404)
    expect((await request.delete('/api/pages/999')).status()).toBe(404)
  })
})
