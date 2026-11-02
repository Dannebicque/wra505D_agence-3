import { describe, expect, it } from 'vitest'
import { computeCounters } from '../../../app/utils/tableau-de-bord'
import { ETUDIANTS } from '../../../server/data/etudiants'
import { REFERENTIELS } from '../../../server/data/referentiels'
import { TRACES } from '../../../server/data/traces'
import { VALIDATIONS } from '../../../server/data/validations'

describe('données factices de l’étudiante de démo', () => {
  it('contient Léa, l’étudiante de démo', () => {
    expect(ETUDIANTS[0]?.['@id']).toBe('/api/etudiants/1')
    expect(ETUDIANTS[0]?.prenom).toBe('Léa')
  })

  // Mêmes chiffres que la maquette A (docs/design/maquette-a-editorial.png)
  it('donne les compteurs de la maquette', () => {
    expect(computeCounters(TRACES, VALIDATIONS)).toEqual({
      traces: 8,
      drafts: 2,
      validations: 8,
      acquired: 3,
      inProgress: 2,
      notAcquired: 1,
      pending: 2,
      pendingTraces: 2,
    })
  })

  it('ne référence que des traces et des niveaux qui existent', () => {
    const traces = new Set(TRACES.map((t) => t['@id']))
    const niveaux = new Set(
      REFERENTIELS.flatMap((r) => r.competences.flatMap((c) => c.niveaux.map((n) => n['@id']))),
    )
    for (const v of VALIDATIONS) {
      expect(traces.has(v.trace), v['@id']).toBe(true)
      expect(niveaux.has(v.niveau), v['@id']).toBe(true)
    }
  })
})
