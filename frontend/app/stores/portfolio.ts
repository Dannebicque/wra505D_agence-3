import type { Iri } from '#shared/types/api'
import type { Page, PageInfo } from '#shared/types/portfolio'
import {
  createPage,
  deletePage,
  getPage,
  getPortfolio,
  listPages,
  updatePage,
  updatePageOrder,
} from '~/services/portfolio'

/** Portfolios de l'étudiant et leurs pages-projets : lecture et modification. */
export const usePortfolioStore = defineStore('portfolio', () => {
  // Capturées à la création du store (dans `setup`) : le contexte Nuxt est perdu après un `await`
  const requestOptions = useApiRequestOptions()

  return {
    get: (id: string) => getPortfolio(id, requestOptions),
    setPageOrder: (id: string, pages: Iri[]) => updatePageOrder(id, pages),
    listPages: (portfolio: Iri) => listPages(portfolio, requestOptions),
    getPage: (id: string) => getPage(id, requestOptions),
    createPage: (portfolio: Iri, info: PageInfo) => createPage(portfolio, info),
    updatePage: (id: string, changes: Partial<PageInfo & Pick<Page, 'traces'>>) =>
      updatePage(id, changes),
    deletePage: (id: string) => deletePage(id),
  }
})
