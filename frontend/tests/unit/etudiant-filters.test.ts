import { describe, expect, it } from 'vitest'
import {
  ETUDIANT_FILTER_OPTIONS,
  filterDemoEtudiants,
  studentCounters,
} from '../../app/demo/enseignant'
import { ALL } from '../../app/utils/filters'
import {
  DEFAULT_ETUDIANT_CRITERIA,
  etudiantCriteriaFromQuery,
  etudiantCriteriaToQuery,
  type EtudiantCriteria,
} from '../../app/utils/etudiant-filters'

const parse = (query: Record<string, unknown>) =>
  etudiantCriteriaFromQuery(query, ETUDIANT_FILTER_OPTIONS)
const names = (criteria: Partial<EtudiantCriteria>) =>
  filterDemoEtudiants({ ...DEFAULT_ETUDIANT_CRITERIA, ...criteria }).map((e) => e.prenom)

describe('critères de la liste des étudiants', () => {
  it('lit l’URL et retombe sur « tous » pour une valeur inconnue', () => {
    expect(parse({})).toEqual(DEFAULT_ETUDIANT_CRITERIA)
    expect(
      parse({ groupe: 'TP Z9', annee: ['BUT MMI 2'], parcours: 'Création numérique' }),
    ).toEqual({ ...DEFAULT_ETUDIANT_CRITERIA, groupe: ALL, parcours: 'Création numérique' })
  })

  it('ne coche « travaux en attente » que pour enAttente=1', () => {
    expect(parse({ enAttente: '1' }).enAttente).toBe(true)
    expect(parse({ enAttente: 'oui' }).enAttente).toBe(false)
  })

  it('fait l’aller-retour sans valeurs par défaut dans l’URL', () => {
    const query = { recherche: 'ines', enAttente: '1', groupe: 'TP A2' }
    expect(etudiantCriteriaToQuery(parse(query))).toEqual(query)
    expect(etudiantCriteriaToQuery(parse({ groupe: ALL, enAttente: '0' }))).toEqual({})
  })
})

describe('filterDemoEtudiants', () => {
  it('trouve « Inès » en tapant « ines »', () => {
    expect(names({ recherche: 'ines' })).toEqual(['Inès'])
  })

  it('ne garde, si on le demande, que les étudiants ayant des traces à évaluer', () => {
    const pending = filterDemoEtudiants({ ...DEFAULT_ETUDIANT_CRITERIA, enAttente: true })
    expect(pending.length).toBeGreaterThan(0)
    expect(pending.every((e) => studentCounters(e.id).pendingTraces > 0)).toBe(true)
    expect(pending.length).toBeLessThan(names({}).length)
  })

  it('trie par nom et combine les critères', () => {
    expect(names({ groupe: 'TP A1', annee: 'BUT MMI 2' })).toEqual(['Hugo', 'Léa'])
  })
})
