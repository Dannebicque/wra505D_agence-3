import { describe, expect, it } from 'vitest'
import type { Iri } from '../../../shared/types/api'
import type { Page, Portfolio } from '../../../shared/types/portfolio'
import { createPortfolioRepository } from '../../../server/utils/portfolio-repository'

const NOW = '2026-11-04T10:00:00.000Z'

function page(id: number, traces: Iri[] = []): Page {
  return {
    '@id': `/api/pages/${id}`,
    '@type': 'Page',
    portfolio: '/api/portfolios/1',
    intitule: `Page ${id}`,
    description: null,
    traces,
    dateSuppression: null,
  }
}

const PORTFOLIO: Portfolio = {
  '@id': '/api/portfolios/1',
  '@type': 'Portfolio',
  etudiant: '/api/etudiants/1',
  annee: '/api/annees/1',
  intitule: 'Portfolio',
  description: null,
  banniere: null,
  visibilite: 'privee',
  visibleRecruteurs: false,
  pages: ['/api/pages/2', '/api/pages/1'],
  dateCreation: '2026-10-01',
  dateModification: null,
  dateSuppression: null,
}

const repository = (options?: { maxSessions?: number; maxPages?: number }) =>
  createPortfolioRepository({ portfolios: [PORTFOLIO], pages: [page(1), page(2)] }, options)

describe('createPortfolioRepository', () => {
  it('liste les pages d’un portfolio dans l’ordre du portfolio', () => {
    const pages = repository().listPages('a', '/api/portfolios/1')

    expect(pages.map((p) => p['@id'])).toEqual(['/api/pages/2', '/api/pages/1'])
  })

  it('ne liste aucune page pour un portfolio inconnu', () => {
    expect(repository().listPages('a', '/api/portfolios/999')).toEqual([])
  })

  it('liste les pages hors corbeille de tous les portfolios sans filtre', () => {
    const repo = repository()
    repo.deletePage('a', '1', NOW)

    expect(repo.listPages('a').map((p) => p['@id'])).toEqual(['/api/pages/2'])
  })

  it('ajoute une page créée à la fin du portfolio, sans trace', () => {
    const repo = repository()

    const created = repo.createPage(
      'a',
      '/api/portfolios/1',
      { intitule: 'Nouvelle', description: null },
      NOW,
    )

    expect(created).toMatchObject({ '@id': '/api/pages/3', intitule: 'Nouvelle', traces: [] })
    expect(repo.getPortfolio('a', '1')).toMatchObject({
      pages: ['/api/pages/2', '/api/pages/1', '/api/pages/3'],
      dateModification: NOW,
    })
  })

  it('refuse de créer une page au-delà du maximum (mémoire bornée)', () => {
    const repo = repository({ maxPages: 2 })

    expect(
      repo.createPage('a', '/api/portfolios/1', { intitule: 'De trop', description: null }, NOW),
    ).toBeUndefined()
  })

  it('modifie une page et date le portfolio', () => {
    const repo = repository()

    const updated = repo.updatePage('a', '1', { traces: ['/api/traces/5'] }, NOW)

    expect(updated).toMatchObject({ intitule: 'Page 1', traces: ['/api/traces/5'] })
    expect(repo.getPortfolio('a', '1')?.dateModification).toBe(NOW)
  })

  it('range la page supprimée dans la corbeille et la retire du portfolio', () => {
    const repo = repository()

    expect(repo.deletePage('a', '2', NOW)).toBe(true)

    expect(repo.getPage('a', '2')?.dateSuppression).toBe(NOW)
    expect(repo.getPortfolio('a', '1')?.pages).toEqual(['/api/pages/1'])
    expect(repo.listPages('a', '/api/portfolios/1').map((p) => p['@id'])).toEqual(['/api/pages/1'])
  })

  it('ne réutilise pas l’identifiant d’une page supprimée', () => {
    const repo = repository()
    repo.deletePage('a', '2', NOW)

    const created = repo.createPage(
      'a',
      '/api/portfolios/1',
      { intitule: 'Nouvelle', description: null },
      NOW,
    )

    expect(created?.['@id']).toBe('/api/pages/3')
  })

  it('enregistre le nouvel ordre des pages', () => {
    const repo = repository()

    repo.setPageOrder('a', '1', ['/api/pages/1', '/api/pages/2'], NOW)

    expect(repo.listPages('a', '/api/portfolios/1').map((p) => p['@id'])).toEqual([
      '/api/pages/1',
      '/api/pages/2',
    ])
  })

  it('isole les données de chaque visiteur', () => {
    const repo = repository()

    repo.deletePage('a', '2', NOW)

    expect(repo.getPortfolio('b', '1')?.pages).toEqual(['/api/pages/2', '/api/pages/1'])
    expect(repo.getPage('b', '2')?.dateSuppression).toBeNull()
  })

  it('oublie le visiteur le moins récent au-delà du maximum de sessions', () => {
    const repo = repository({ maxSessions: 1 })
    repo.deletePage('a', '2', NOW)

    repo.getPortfolio('b', '1')

    expect(repo.getPortfolio('a', '1')?.pages).toEqual(['/api/pages/2', '/api/pages/1'])
  })
})
