import { describe, expect, it } from 'vitest'
import { REFERENTIELS } from '../../../server/data/referentiels'

/** Tous les `@id` contenus dans une valeur, enfants compris. */
function collectIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectIds)
  if (value === null || typeof value !== 'object') return []
  const own = '@id' in value && typeof value['@id'] === 'string' ? [value['@id']] : []
  return [...own, ...Object.values(value).flatMap(collectIds)]
}

describe('référentiel factice', () => {
  const [mmi] = REFERENTIELS

  it('contient le référentiel du B.U.T. MMI', () => {
    expect(mmi?.['@id']).toBe('/api/referentiels/1')
    expect(mmi?.libelle).toBe('Référentiel de compétences du B.U.T. MMI')
  })

  it('contient les 5 compétences MMI dans l’ordre des couleurs c1 à c5', () => {
    expect(mmi?.competences.map((competence) => competence.nomCourt)).toEqual([
      'Comprendre',
      'Concevoir',
      'Exprimer',
      'Développer',
      'Entreprendre',
    ])
    expect(mmi?.competences.map((competence) => competence.couleur)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
    ])
  })

  it('donne 3 niveaux ordonnés à chaque compétence, chacun avec au moins un apprentissage critique', () => {
    for (const competence of mmi?.competences ?? []) {
      expect(competence.niveaux.map((niveau) => niveau.ordre)).toEqual([1, 2, 3])
      for (const niveau of competence.niveaux) {
        expect(niveau.apprentissagesCritiques.length).toBeGreaterThan(0)
      }
    }
  })

  it('utilise des IRI uniques au format ApiPlatform', () => {
    const ids = collectIds(REFERENTIELS)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id.startsWith('/api/')).toBe(true)
    }
  })
})
