import type { Iri } from '../../shared/types/api'
import type { Page, PageInfo, Portfolio } from '../../shared/types/portfolio'
import { iri } from '../../shared/utils/iri'
import { apiFetch, apiFetchAll, type ApiFetchOptions } from './api'

/** Modification partielle, au format attendu par ApiPlatform. */
const MERGE_PATCH = { 'Content-Type': 'application/merge-patch+json' }

export function getPortfolio(id: string | number, options?: ApiFetchOptions): Promise<Portfolio> {
  return apiFetch<Portfolio>(iri('portfolios', id), options)
}

/** Ordre des pages : la liste doit reprendre exactement les pages du portfolio. */
export function updatePageOrder(id: string | number, pages: Iri[]): Promise<Portfolio> {
  return apiFetch<Portfolio>(iri('portfolios', id), {
    method: 'PATCH',
    body: { pages },
    headers: MERGE_PATCH,
  })
}

/** Pages d'un portfolio, dans leur ordre d'affichage (filtre `portfolio` d'ApiPlatform). */
export function listPages(portfolio: Iri, options?: ApiFetchOptions): Promise<Page[]> {
  return apiFetchAll<Page>(`/api/pages?portfolio=${encodeURIComponent(portfolio)}`, options)
}

export function getPage(id: string | number, options?: ApiFetchOptions): Promise<Page> {
  return apiFetch<Page>(iri('pages', id), options)
}

/** La page est ajoutée en fin de portfolio, sans trace. */
export function createPage(portfolio: Iri, info: PageInfo): Promise<Page> {
  return apiFetch<Page>('/api/pages', { method: 'POST', body: { portfolio, ...info } })
}

export function updatePage(
  id: string | number,
  changes: Partial<PageInfo & Pick<Page, 'traces'>>,
): Promise<Page> {
  return apiFetch<Page>(iri('pages', id), { method: 'PATCH', body: changes, headers: MERGE_PATCH })
}

/** La page part à la corbeille ; ses traces restent dans la bibliothèque. */
export async function deletePage(id: string | number): Promise<void> {
  await apiFetch<null>(iri('pages', id), { method: 'DELETE' })
}
