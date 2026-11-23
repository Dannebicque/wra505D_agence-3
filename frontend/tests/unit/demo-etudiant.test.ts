import { describe, expect, it } from 'vitest'
import { COMPETENCES, ETATS } from '../../app/demo/base'
import {
  COMPETENCE_STATUTS,
  SUIVI_COMPETENCES,
  competenceStatut,
  competenceSuivi,
} from '../../app/demo/etudiant'

describe('competenceStatut', () => {
  it.each([
    [[], 'non-evaluee'],
    [[0, 0], 'non-evaluee'],
    [[1, 0], 'non-acquis'],
    [[1, 2], 'en-cours'],
    [[1, 2, 3], 'acquis'],
  ] as const)('%j donne %s (la meilleure évaluation l’emporte)', (etats, statut) => {
    expect(competenceStatut(etats)).toBe(statut)
  })
})

describe('icônes des statuts de compétence', () => {
  it('reprennent celles des états d’évaluation', () => {
    expect(COMPETENCE_STATUTS.acquis.icon).toBe(ETATS[3].icon)
    expect(COMPETENCE_STATUTS['en-cours'].icon).toBe(ETATS[2].icon)
    expect(COMPETENCE_STATUTS['non-acquis'].icon).toBe(ETATS[1].icon)
  })

  it('gardent pour « non évaluée » une icône qui ne désigne aucun état', () => {
    const etatIcons = Object.values(ETATS).map((e) => e.icon)
    expect(etatIcons).not.toContain(COMPETENCE_STATUTS['non-evaluee'].icon)
  })
})

describe('competenceSuivi', () => {
  it('liste les brouillons sans les compter dans la progression', () => {
    // Entreprendre : seule la trace 7 (brouillon) de Léa la vise
    const entreprendre = SUIVI_COMPETENCES.find((s) => s.competence.nomCourt === 'Entreprendre')
    expect(entreprendre?.traces.map((t) => t.trace.id)).toEqual([7])
    expect(entreprendre?.total).toBe(0)
    expect(entreprendre?.statut).toBe('non-evaluee')
  })

  it('compte chaque évaluation de trace finalisée', () => {
    const developper = COMPETENCES.find((c) => c.nomCourt === 'Développer')
    const suivi = developper && competenceSuivi(developper)
    // Traces 1 (acquis), 4 (en attente) et 5 (en cours)
    expect(suivi).toMatchObject({ acquired: 1, inProgress: 1, pending: 1, total: 3 })
    expect(suivi?.statut).toBe('acquis')
  })
})
