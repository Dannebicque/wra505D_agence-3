import { describe, expect, it } from 'vitest'
import { idFromIri, iri } from '../../../shared/utils/iri'

describe('iri', () => {
  it('construit un IRI ApiPlatform à partir d’une ressource et d’un identifiant numérique', () => {
    expect(iri('traces', 12)).toBe('/api/traces/12')
  })

  it('accepte un identifiant textuel', () => {
    expect(iri('referentiels', 'mmi')).toBe('/api/referentiels/mmi')
  })
})

describe('idFromIri', () => {
  it('extrait l’identifiant du dernier segment', () => {
    expect(idFromIri('/api/traces/12')).toBe('12')
  })
})
