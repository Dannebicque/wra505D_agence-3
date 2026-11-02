import { describe, expect, it } from 'vitest'
import type { JsonLdResource } from '../../../shared/types/api'
import { findByIri, ITEMS_PER_PAGE, toCollection } from '../../../server/utils/hydra'

const PATH = '/api/tests'

function elements(count: number): JsonLdResource[] {
  return Array.from({ length: count }, (_, index) => ({
    '@id': `/api/tests/${index + 1}`,
    '@type': 'Test',
  }))
}

describe('toCollection', () => {
  it('pagine par 30 éléments, comme ApiPlatform', () => {
    expect(ITEMS_PER_PAGE).toBe(30)
  })

  it('renvoie la première page et ses liens quand aucune page n’est demandée', () => {
    const collection = toCollection(PATH, elements(65), {})

    expect(collection['@id']).toBe(PATH)
    expect(collection['@type']).toBe('Collection')
    expect(collection.totalItems).toBe(65)
    expect(collection.member).toHaveLength(30)
    expect(collection.member[0]?.['@id']).toBe('/api/tests/1')
    expect(collection.view).toEqual({
      '@id': '/api/tests?page=1',
      '@type': 'PartialCollectionView',
      first: '/api/tests?page=1',
      last: '/api/tests?page=3',
      next: '/api/tests?page=2',
    })
  })

  it('renvoie la dernière page, partielle, avec un lien vers la précédente', () => {
    const collection = toCollection(PATH, elements(65), { page: '3' })

    expect(collection.member).toHaveLength(5)
    expect(collection.member[0]?.['@id']).toBe('/api/tests/61')
    expect(collection.view?.previous).toBe('/api/tests?page=2')
    expect(collection.view?.next).toBeUndefined()
  })

  it.each(['abc', '0', '-1', '2.5', ''])(
    'traite la page invalide « %s » comme la page 1',
    (page) => {
      const collection = toCollection(PATH, elements(65), { page })

      expect(collection.member[0]?.['@id']).toBe('/api/tests/1')
      expect(collection.view?.['@id']).toBe('/api/tests?page=1')
    },
  )

  it('renvoie une page vide au-delà de la dernière page', () => {
    const collection = toCollection(PATH, elements(65), { page: '99' })

    expect(collection.member).toEqual([])
    expect(collection.totalItems).toBe(65)
  })

  it('n’ajoute pas de liens de pagination quand tout tient sur une page', () => {
    const collection = toCollection(PATH, elements(10), {})

    expect(collection.member).toHaveLength(10)
    expect(collection.view).toBeUndefined()
  })

  it('renvoie une collection vide sans erreur', () => {
    const collection = toCollection(PATH, [], {})

    expect(collection.member).toEqual([])
    expect(collection.totalItems).toBe(0)
  })
})

describe('findByIri', () => {
  it('retrouve un élément par son IRI', () => {
    expect(findByIri(elements(3), '/api/tests/2')?.['@id']).toBe('/api/tests/2')
  })

  it('renvoie undefined pour un IRI inconnu', () => {
    expect(findByIri(elements(3), '/api/tests/99')).toBeUndefined()
  })
})
