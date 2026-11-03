import { describe, expect, it } from 'vitest'
import { TRACE_FILTER_OPTIONS, filterSubmittedTraces } from '../../app/demo/enseignant'
import { ALL, criteriaDiff, normalize } from '../../app/utils/filters'
import {
  DEFAULT_CRITERIA,
  criteriaFromQuery,
  criteriaToQuery,
  isTracePending,
  type TraceCriteria,
} from '../../app/utils/trace-filters'

const parse = (query: Record<string, unknown>) => criteriaFromQuery(query, TRACE_FILTER_OPTIONS)
const ids = (criteria: Partial<TraceCriteria>) =>
  filterSubmittedTraces({ ...DEFAULT_CRITERIA, ...criteria }).map((t) => t.id)

describe('normalize', () => {
  it('ignore la casse, les accents et les espaces autour', () => {
    expect(normalize('  Léa ÉTÉ ')).toBe('lea ete')
  })
})

describe('criteriaFromQuery', () => {
  it('donne les critères par défaut sans paramètre (traces non évaluées)', () => {
    expect(parse({})).toEqual(DEFAULT_CRITERIA)
    expect(DEFAULT_CRITERIA.statut).toBe('a-evaluer')
  })

  it('garde les valeurs connues', () => {
    expect(
      parse({ recherche: 'api', etudiant: '1', groupe: 'TP A1', competence: '4', statut: 'tous' }),
    ).toEqual({ recherche: 'api', etudiant: '1', groupe: 'TP A1', competence: '4', statut: ALL })
  })

  it('retombe sur le statut par défaut pour un statut invalide', () => {
    expect(parse({ statut: 'archivees' }).statut).toBe('a-evaluer')
  })

  it.each(['etudiant', 'groupe', 'competence'])(
    'retombe sur « tous » pour un %s inconnu',
    (key) => {
      expect(parse({ [key]: '999' })[key as keyof TraceCriteria]).toBe(ALL)
    },
  )

  it('ignore un paramètre répété (tableau)', () => {
    expect(parse({ statut: ['evaluees', 'tous'], recherche: ['a', 'b'], etudiant: ['1'] })).toEqual(
      DEFAULT_CRITERIA,
    )
  })
})

describe('criteriaToQuery', () => {
  it('ne met dans l’URL que les critères différents des valeurs par défaut', () => {
    expect(criteriaToQuery({ ...DEFAULT_CRITERIA })).toEqual({})
    expect(criteriaToQuery({ ...DEFAULT_CRITERIA, etudiant: '3', statut: ALL })).toEqual({
      etudiant: '3',
      statut: ALL,
    })
  })

  it.each([
    [{}, {}],
    [{ statut: 'a-evaluer', groupe: 'tous', recherche: '' }, {}],
    [
      { etudiant: '1', statut: 'evaluees', recherche: 'Léa' },
      { etudiant: '1', statut: 'evaluees', recherche: 'Léa' },
    ],
    [{ etudiant: '999', competence: '2' }, { competence: '2' }],
  ])('fait l’aller-retour %j → %j', (query, expected) => {
    expect(criteriaToQuery(parse(query))).toEqual(expected)
    // Et l'URL produite se relit à l'identique
    expect(criteriaToQuery(parse(criteriaToQuery(parse(query))))).toEqual(expected)
  })

  it('écrit une case cochée « 1 » et omet une case décochée par défaut', () => {
    expect(criteriaDiff({ a: true, b: false }, { a: false, b: false })).toEqual({ a: '1' })
  })
})

describe('filterTraces', () => {
  it('trouve « Léa » en tapant « lea », sans tenir compte de la casse', () => {
    const lea = ids({ recherche: 'lea', statut: ALL })
    expect(lea).toEqual(ids({ recherche: 'LÉA', statut: ALL }))
    expect(lea).toEqual(ids({ etudiant: '1', statut: ALL }))
    expect(lea.length).toBeGreaterThan(0)
  })

  it('cherche aussi dans le titre, sans accents', () => {
    expect(ids({ recherche: 'fete de la science' })).toEqual([9])
  })

  it('ne montre jamais les brouillons (traces 7 et 8 de Léa)', () => {
    const all = ids({ statut: ALL })
    expect(all).not.toContain(7)
    expect(all).not.toContain(8)
  })

  it('combine étudiant, compétence et statut, les plus anciennes d’abord', () => {
    expect(ids({ etudiant: '1', competence: '4', statut: ALL })).toEqual([5, 4, 1])
    expect(ids({ groupe: 'TP A1' })).toEqual([4, 2])
  })

  it('classe une trace partiellement évaluée parmi les traces à évaluer, pas les évaluées', () => {
    // Trace 4 : Exprimer acquis, Développer en attente
    expect(ids({ etudiant: '1', statut: 'evaluees' })).toEqual([5, 6, 3, 1])
    expect(ids({ etudiant: '1' })).toEqual([4, 2])
  })

  it('renvoie une liste vide si rien ne correspond', () => {
    expect(ids({ recherche: 'aucune trace ne porte ce titre' })).toEqual([])
  })
})

describe('isTracePending', () => {
  it('attend l’évaluation tant qu’une compétence est en attente', () => {
    expect(isTracePending({ competences: [{ competenceId: 1, etat: 3 }] })).toBe(false)
    expect(
      isTracePending({
        competences: [
          { competenceId: 1, etat: 3 },
          { competenceId: 2, etat: 0 },
        ],
      }),
    ).toBe(true)
  })
})
