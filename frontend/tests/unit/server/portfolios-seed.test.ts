import { describe, expect, it } from 'vitest'
import { PORTFOLIOS as DEMO_PORTFOLIOS } from '../../../app/demo/base'
import { PAGES, PORTFOLIOS } from '../../../server/data/portfolios'
import { TRACES } from '../../../server/data/traces'
import { idFromIri } from '../../../shared/utils/iri'

// Tant que l'aperçu et le portfolio public restent en maquette, ils doivent décrire les mêmes pages
describe('données de démonstration des portfolios', () => {
  it('reprend les pages de la maquette, dans le même ordre', () => {
    const fromSeed = PORTFOLIOS.map((portfolio) => ({
      id: Number(idFromIri(portfolio['@id'])),
      pages: portfolio.pages.map((pageIri) => {
        const page = PAGES.find((p) => p['@id'] === pageIri)
        return {
          id: Number(idFromIri(pageIri)),
          intitule: page?.intitule,
          traceIds: page?.traces.map((t) => Number(idFromIri(t))),
        }
      }),
    }))

    expect(fromSeed).toEqual(
      DEMO_PORTFOLIOS.map((portfolio) => ({
        id: portfolio.id,
        pages: portfolio.pages.map(({ id, intitule, traceIds }) => ({ id, intitule, traceIds })),
      })),
    )
  })

  it('ne référence que des traces existantes', () => {
    const known = new Set(TRACES.map((t) => t['@id']))

    expect(PAGES.flatMap((p) => p.traces).filter((t) => !known.has(t))).toEqual([])
  })

  it('ne met aucune trace dans deux pages d’un même portfolio', () => {
    for (const portfolio of PORTFOLIOS) {
      const traces = PAGES.filter((p) => p.portfolio === portfolio['@id']).flatMap((p) => p.traces)

      expect(new Set(traces).size).toBe(traces.length)
    }
  })
})
