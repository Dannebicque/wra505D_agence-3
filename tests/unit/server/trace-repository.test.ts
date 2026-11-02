import { describe, expect, it } from 'vitest'
import type { Trace, TraceInput } from '../../../shared/types/trace'
import { createTraceRepository } from '../../../server/utils/trace-repository'

const SEED: Trace[] = [
  {
    '@id': '/api/traces/1',
    '@type': 'Trace',
    bibliotheque: '/api/bibliotheques/1',
    titre: 'Existante',
    description: null,
    contexte: null,
    legende: null,
    type: 'lien',
    contenu: ['https://a.example'],
    statut: 'finalisee',
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
    dateRealisation: null,
    dateCreation: '2026-10-01',
    dateModification: null,
    dateSuppression: null,
  },
]

const INPUT: TraceInput = {
  titre: 'Nouvelle',
  description: null,
  contexte: null,
  type: 'video',
  contenu: ['https://video.example/1'],
  statut: 'brouillon',
  conceptionIa: 'aucun',
  realisationIa: 'aucun',
  dateRealisation: '2026-10-30',
}

describe('dépôt de traces de démonstration', () => {
  it('donne à chaque visiteur sa propre copie des données', () => {
    const repo = createTraceRepository(SEED)

    repo.create('visiteur-a', INPUT, '2026-11-02T10:00:00Z')

    expect(repo.list('visiteur-a')).toHaveLength(2)
    expect(repo.list('visiteur-b')).toHaveLength(1)
  })

  it('crée une trace avec un nouvel IRI et ses dates', () => {
    const repo = createTraceRepository(SEED)

    const trace = repo.create('a', INPUT, '2026-11-02T10:00:00Z')

    expect(trace).toMatchObject({
      ...INPUT,
      '@id': '/api/traces/2',
      '@type': 'Trace',
      bibliotheque: '/api/bibliotheques/1',
      legende: null,
      dateCreation: '2026-11-02T10:00:00Z',
      dateModification: '2026-11-02T10:00:00Z',
      dateSuppression: null,
    })
    expect(repo.get('a', '2')).toEqual(trace)
  })

  it('modifie une trace existante et renvoie undefined pour une trace inconnue', () => {
    const repo = createTraceRepository(SEED)

    const updated = repo.update('a', '1', { ...INPUT, titre: 'Renommée' }, '2026-11-02T11:00:00Z')

    expect(updated?.titre).toBe('Renommée')
    expect(updated?.dateCreation).toBe('2026-10-01')
    expect(updated?.dateModification).toBe('2026-11-02T11:00:00Z')
    expect(repo.update('a', '99', INPUT, '2026-11-02T11:00:00Z')).toBeUndefined()
    expect(repo.get('a', 'abc')).toBeUndefined()
  })

  it('ne modifie jamais les données de départ', () => {
    const repo = createTraceRepository(SEED)

    repo.update('a', '1', { ...INPUT, titre: 'Renommée' }, '2026-11-02T11:00:00Z')

    expect(SEED[0]?.titre).toBe('Existante')
    expect(repo.get('b', '1')?.titre).toBe('Existante')
  })

  it('oublie les visiteurs les plus anciens au-delà de la limite', () => {
    const repo = createTraceRepository(SEED, { maxSessions: 2 })

    repo.create('a', INPUT, '2026-11-02T10:00:00Z')
    repo.list('b')
    repo.list('c')

    expect(repo.list('a')).toHaveLength(1)
  })
})
