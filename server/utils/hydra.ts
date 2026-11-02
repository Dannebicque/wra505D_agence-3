// Fonctions pures, sans import de h3 : testables hors du runtime Nitro (projet Vitest `unit`).
import type { HydraCollection, HydraView, JsonLdResource } from '../../shared/types/api'

/** Taille de page par défaut d'ApiPlatform. */
export const ITEMS_PER_PAGE = 30

/** Lit le numéro de page demandé ; toute valeur invalide donne la page 1. */
function parsePage(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/** Met une liste au format d'une collection ApiPlatform, paginée via `?page=`. */
export function toCollection<T>(
  path: string,
  items: readonly T[],
  query: Record<string, unknown>,
): HydraCollection<T> {
  const page = parsePage(query.page)
  const start = (page - 1) * ITEMS_PER_PAGE
  const collection: HydraCollection<T> = {
    '@id': path,
    '@type': 'Collection',
    totalItems: items.length,
    member: items.slice(start, start + ITEMS_PER_PAGE),
  }

  if (items.length > ITEMS_PER_PAGE) {
    const lastPage = Math.ceil(items.length / ITEMS_PER_PAGE)
    const view: HydraView = {
      '@id': `${path}?page=${page}`,
      '@type': 'PartialCollectionView',
      first: `${path}?page=1`,
      last: `${path}?page=${lastPage}`,
    }
    if (page > 1) view.previous = `${path}?page=${page - 1}`
    if (page < lastPage) view.next = `${path}?page=${page + 1}`
    collection.view = view
  }

  return collection
}

export function findByIri<T extends JsonLdResource>(
  items: readonly T[],
  value: string,
): T | undefined {
  return items.find((item) => item['@id'] === value)
}
