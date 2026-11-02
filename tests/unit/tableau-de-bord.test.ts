import { describe, expect, it } from 'vitest'
import type { Iri } from '../../shared/types/api'
import type { ValidationEtat, Validation } from '../../shared/types/evaluation'
import type { Referentiel } from '../../shared/types/referentiel'
import type { Trace, TraceStatut } from '../../shared/types/trace'
import {
  computeCounters,
  computeProgression,
  draftTraces,
  greetingFact,
} from '../../app/utils/tableau-de-bord'

function trace(id: number, statut: TraceStatut, dateSuppression: string | null = null): Trace {
  return {
    '@id': `/api/traces/${id}`,
    '@type': 'Trace',
    bibliotheque: '/api/bibliotheques/1',
    titre: `Trace ${id}`,
    description: null,
    contexte: null,
    legende: null,
    type: 'lien',
    contenu: [],
    statut,
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
    dateRealisation: null,
    dateCreation: '2026-10-01',
    dateModification: null,
    dateSuppression,
  }
}

let validationId = 0
function validation(traceId: number, niveau: Iri, etat: ValidationEtat): Validation {
  return {
    '@id': `/api/validations/${++validationId}`,
    '@type': 'Validation',
    trace: `/api/traces/${traceId}`,
    niveau,
    enseignant: etat === 0 ? null : '/api/enseignants/1',
    etat,
    dateCreation: '2026-10-01',
    dateModification: null,
  }
}

const N_COMPRENDRE: Iri = '/api/niveaux/2'
const N_DEVELOPPER: Iri = '/api/niveaux/11'

const REFERENTIEL: Referentiel = {
  '@id': '/api/referentiels/1',
  '@type': 'Referentiel',
  libelle: 'Test',
  departement: null,
  competences: [
    {
      '@id': '/api/competences/1',
      '@type': 'Competence',
      libelle: 'Comprendre…',
      nomCourt: 'Comprendre',
      couleur: 'c1',
      niveaux: [
        {
          '@id': N_COMPRENDRE,
          '@type': 'Niveau',
          libelle: 'N2',
          ordre: 2,
          annee: null,
          parcours: [],
          apprentissagesCritiques: [],
        },
      ],
    },
    {
      '@id': '/api/competences/4',
      '@type': 'Competence',
      libelle: 'Développer…',
      nomCourt: 'Développer',
      couleur: 'c4',
      niveaux: [
        {
          '@id': N_DEVELOPPER,
          '@type': 'Niveau',
          libelle: 'N2',
          ordre: 2,
          annee: null,
          parcours: [],
          apprentissagesCritiques: [],
        },
      ],
    },
  ],
}

// Traces 1 à 3 finalisées, 4 en brouillon, 5 supprimée (corbeille)
const TRACES = [
  trace(1, 'finalisee'),
  trace(2, 'finalisee'),
  trace(3, 'finalisee'),
  trace(4, 'brouillon'),
  trace(5, 'finalisee', '2026-10-20'),
]
const VALIDATIONS = [
  validation(1, N_DEVELOPPER, 3),
  validation(1, N_COMPRENDRE, 2),
  validation(2, N_DEVELOPPER, 1),
  validation(3, N_COMPRENDRE, 0),
  validation(4, N_COMPRENDRE, 0), // brouillon : pas encore soumis
  validation(5, N_DEVELOPPER, 3), // trace supprimée : ignorée
]

describe('computeCounters', () => {
  it('compte les traces hors corbeille et les validations des seules traces finalisées', () => {
    expect(computeCounters(TRACES, VALIDATIONS)).toEqual({
      traces: 4,
      drafts: 1,
      validations: 4,
      acquired: 1,
      inProgress: 1,
      notAcquired: 1,
      pending: 1,
      pendingTraces: 1,
    })
  })

  it('renvoie des zéros sans trace', () => {
    expect(computeCounters([], [])).toEqual({
      traces: 0,
      drafts: 0,
      validations: 0,
      acquired: 0,
      inProgress: 0,
      notAcquired: 0,
      pending: 0,
      pendingTraces: 0,
    })
  })
})

describe('computeProgression', () => {
  it('répartit les validations par compétence du référentiel, dans son ordre', () => {
    const progression = computeProgression(REFERENTIEL, TRACES, VALIDATIONS)

    expect(
      progression.map((p) => [
        p.competence.nomCourt,
        p.acquired,
        p.inProgress,
        p.notAcquired,
        p.pending,
      ]),
    ).toEqual([
      ['Comprendre', 0, 1, 0, 1],
      ['Développer', 1, 0, 1, 0],
    ])
    expect(progression.map((p) => p.total)).toEqual([2, 2])
  })

  it('garde une compétence sans validation, à zéro', () => {
    const progression = computeProgression(REFERENTIEL, [], [])

    expect(progression).toHaveLength(2)
    expect(progression.every((p) => p.total === 0)).toBe(true)
  })
})

describe('draftTraces', () => {
  it('liste les brouillons hors corbeille', () => {
    const drafts = draftTraces([...TRACES, trace(6, 'brouillon', '2026-10-21')])

    expect(drafts.map((t) => t['@id'])).toEqual(['/api/traces/4'])
  })
})

describe('greetingFact', () => {
  it.each([
    [{ traces: 0, pendingTraces: 0 }, 'Déposez votre première trace pour commencer.'],
    [{ traces: 3, pendingTraces: 0 }, 'Toutes vos traces ont été évaluées.'],
    [{ traces: 3, pendingTraces: 1 }, 'Une trace attend son évaluation.'],
    [{ traces: 8, pendingTraces: 2 }, 'Deux traces attendent leur évaluation.'],
    [{ traces: 30, pendingTraces: 12 }, '12 traces attendent leur évaluation.'],
  ])('résume la situation %o', (counters, phrase) => {
    expect(greetingFact(counters)).toBe(phrase)
  })
})
