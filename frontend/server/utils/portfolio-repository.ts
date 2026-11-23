// Dépôt des portfolios et de leurs pages en mémoire pour la phase Nitro (provisoire, remplacé par
// ApiPlatform). Chaque visiteur (cookie de démo) a sa propre copie des données, comme pour les traces.
// Module pur, sans h3 : testable dans le projet `unit`.
import type { Iri } from '../../shared/types/api'
import type { Page, PageInfo, Portfolio } from '../../shared/types/portfolio'
import { idFromIri, iri } from '../../shared/utils/iri'

interface PortfolioData {
  portfolios: Portfolio[]
  pages: Page[]
}

export function createPortfolioRepository(
  seed: { portfolios: readonly Portfolio[]; pages: readonly Page[] },
  { maxSessions = 500, maxPages = 100 } = {},
) {
  const sessions = new Map<string, PortfolioData>()

  function dataOf(session: string): PortfolioData {
    let data = sessions.get(session)
    if (data) {
      // Visiteur actif : remis en fin de file (le plus ancien est oublié en premier)
      sessions.delete(session)
    } else {
      data = structuredClone({ portfolios: [...seed.portfolios], pages: [...seed.pages] })
    }
    sessions.set(session, data)
    if (sessions.size > maxSessions) {
      const oldest = sessions.keys().next().value
      if (oldest !== undefined) sessions.delete(oldest)
    }
    return data
  }

  const findPage = (data: PortfolioData, id: string) =>
    data.pages.find((p) => idFromIri(p['@id']) === id)
  const findPortfolio = (data: PortfolioData, id: string) =>
    data.portfolios.find((p) => idFromIri(p['@id']) === id)
  const touch = (data: PortfolioData, portfolioIri: Iri, now: string) => {
    const portfolio = data.portfolios.find((p) => p['@id'] === portfolioIri)
    if (portfolio) portfolio.dateModification = now
    return portfolio
  }

  return {
    getPortfolio(session: string, id: string): Portfolio | undefined {
      return findPortfolio(dataOf(session), id)
    },

    /** Pages hors corbeille d'un portfolio dans leur ordre d'affichage, ou de tous les portfolios. */
    listPages(session: string, portfolioIri?: Iri): Page[] {
      const data = dataOf(session)
      const portfolios = portfolioIri
        ? data.portfolios.filter((p) => p['@id'] === portfolioIri)
        : data.portfolios
      return portfolios
        .flatMap((portfolio) => portfolio.pages)
        .flatMap((pageIri) => data.pages.filter((p) => p['@id'] === pageIri))
        .filter((page) => page.dateSuppression === null)
    },

    getPage(session: string, id: string): Page | undefined {
      return findPage(dataOf(session), id)
    },

    /** Renvoie `undefined` si le visiteur a atteint le nombre maximal de pages (mémoire bornée). */
    createPage(session: string, portfolioIri: Iri, info: PageInfo, now: string): Page | undefined {
      const data = dataOf(session)
      if (data.pages.length >= maxPages) return undefined
      const portfolio = touch(data, portfolioIri, now)
      if (!portfolio) return undefined
      const nextId = Math.max(0, ...data.pages.map((p) => Number(idFromIri(p['@id'])) || 0)) + 1
      const page: Page = {
        ...info,
        '@id': iri('pages', nextId),
        '@type': 'Page',
        portfolio: portfolioIri,
        traces: [],
        dateSuppression: null,
      }
      data.pages.push(page)
      portfolio.pages.push(page['@id'])
      return page
    },

    updatePage(
      session: string,
      id: string,
      changes: Partial<PageInfo & Pick<Page, 'traces'>>,
      now: string,
    ): Page | undefined {
      const data = dataOf(session)
      const page = findPage(data, id)
      if (!page) return undefined
      Object.assign(page, changes)
      touch(data, page.portfolio, now)
      return page
    },

    /** Range la page dans la corbeille et la retire de l'ordre du portfolio. */
    deletePage(session: string, id: string, now: string): boolean {
      const data = dataOf(session)
      const page = findPage(data, id)
      if (!page || page.dateSuppression !== null) return false
      page.dateSuppression = now
      const portfolio = touch(data, page.portfolio, now)
      if (portfolio) portfolio.pages = portfolio.pages.filter((p) => p !== page['@id'])
      return true
    },

    setPageOrder(session: string, id: string, pages: Iri[], now: string): Portfolio | undefined {
      const data = dataOf(session)
      const portfolio = findPortfolio(data, id)
      if (!portfolio) return undefined
      portfolio.pages = pages
      portfolio.dateModification = now
      return portfolio
    },
  }
}
