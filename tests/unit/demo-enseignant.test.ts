import { describe, expect, it } from 'vitest'
import { ETUDIANTS, ETUDIANT_COURANT_ID, RETOURS, TRACES } from '../../app/demo/base'
import {
  PORTFOLIOS_ETUDIANTS,
  TRACES_SOUMISES,
  acquiredSummary,
  evaluationCounters,
  filterSubmittedTraces,
  progressionByCompetence,
  studentCounters,
  traceDetail,
  traceSoumiseById,
  tracesOfEtudiant,
} from '../../app/demo/enseignant'
import { SUIVI_COMPETENCES } from '../../app/demo/etudiant'
import { ALL } from '../../app/utils/filters'
import { DEFAULT_CRITERIA } from '../../app/utils/trace-filters'
import { TRACES as SERVER_TRACES } from '../../server/data/traces'

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const listed = (etudiant: number, statut: typeof DEFAULT_CRITERIA.statut) =>
  filterSubmittedTraces({ ...DEFAULT_CRITERIA, etudiant: String(etudiant), statut }).length

describe('compteurs de l’espace enseignant', () => {
  it.each(ETUDIANTS.map((e) => [e.prenom, e.id] as const))(
    'les compteurs de %s correspondent à ses listes de traces',
    (_, id) => {
      const counters = studentCounters(id)
      expect(counters.traces).toBe(listed(id, ALL))
      expect(counters.pendingTraces).toBe(listed(id, 'a-evaluer'))
      expect(counters.evaluatedTraces).toBe(listed(id, 'evaluees'))
      expect(counters.acquired).toBeLessThanOrEqual(counters.evaluations)
    },
  )

  it.each(ETUDIANTS.map((e) => [e.prenom, e.id] as const))(
    'la progression par compétence de %s a le même total que ses compteurs',
    (_, id) => {
      const counters = studentCounters(id)
      const progression = progressionByCompetence(tracesOfEtudiant(id))
      expect(sum(progression.map((p) => p.acquired))).toBe(counters.acquired)
      expect(sum(progression.map((p) => p.total - p.pending))).toBe(counters.evaluations)
    },
  )

  it('le tableau de bord additionne exactement les compteurs des étudiants', () => {
    const all = evaluationCounters(TRACES_SOUMISES)
    const perStudent = ETUDIANTS.map((e) => studentCounters(e.id))
    for (const key of ['traces', 'pendingTraces', 'evaluations', 'acquired'] as const) {
      expect(sum(perStudent.map((c) => c[key]))).toBe(all[key])
    }
  })

  it('donne à chaque étudiant au moins une trace évaluée (données plausibles)', () => {
    for (const etudiant of ETUDIANTS) {
      expect(studentCounters(etudiant.id).evaluations).toBeGreaterThan(0)
    }
  })

  it('résume les acquis sans « 0 acquise sur 0 »', () => {
    const base = { traces: 1, pendingTraces: 1, evaluatedTraces: 0 }
    expect(acquiredSummary({ ...base, evaluations: 0, acquired: 0 })).toBe('aucune évaluation')
    expect(acquiredSummary({ ...base, evaluations: 4, acquired: 1 })).toBe('1 acquise sur 4')
    expect(acquiredSummary({ ...base, evaluations: 4, acquired: 3 })).toBe('3 acquises sur 4')
  })
})

describe('données de démonstration', () => {
  it('les traces de Léa reprennent celles du serveur (les maquettes y renvoient)', () => {
    const lea = TRACES.filter((t) => t.etudiantId === ETUDIANT_COURANT_ID)
    expect(lea.map((t) => [`/api/traces/${t.id}`, t.titre, t.type, t.statut])).toEqual(
      SERVER_TRACES.map((t) => [t['@id'], t.titre, t.type, t.statut]),
    )
  })

  it('les liens de l’espace étudiant ne mènent qu’à des traces du serveur', () => {
    const serverIds = new Set(SERVER_TRACES.map((t) => t['@id']))
    const linked = [
      ...RETOURS.map((r) => r.traceId),
      ...SUIVI_COMPETENCES.flatMap((s) => s.traces.map((t) => t.trace.id)),
    ]
    for (const id of linked) expect(serverIds).toContain(`/api/traces/${id}`)
  })

  it('les pages de portfolio ne citent que des traces existantes de leur auteur', () => {
    const allIds = new Set(TRACES.map((t) => t.id).concat(TRACES_SOUMISES.map((t) => t.id)))
    for (const portfolio of PORTFOLIOS_ETUDIANTS) {
      for (const id of portfolio.pages.flatMap((p) => p.traceIds)) {
        expect(allIds).toContain(id)
        const trace = traceSoumiseById(id) ?? TRACES.find((t) => t.id === id)
        expect(trace?.etudiantId).toBe(portfolio.etudiantId)
      }
    }
  })

  it('n’a pas deux traces avec le même identifiant', () => {
    const ids = TRACES_SOUMISES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reprend l’auteur et la date de l’évaluation existante dans les retours', () => {
    const trace = traceSoumiseById(5)
    expect(trace && traceDetail(trace).evaluation).toEqual({
      enseignant: 'M. Garnier',
      date: '2026-10-20',
      commentaire: '',
    })
    const trace1 = traceSoumiseById(1)
    expect(trace1 && traceDetail(trace1).evaluation?.enseignant).toBe('Mme Dupont')
  })

  it('n’a pas d’évaluation existante pour une trace entièrement en attente', () => {
    const trace = traceSoumiseById(2)
    expect(trace && traceDetail(trace).evaluation).toBeNull()
  })
})
