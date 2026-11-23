import { describe, expect, it } from 'vitest'
import {
  CONCEPTION_IA_LIBELLES,
  REALISATION_IA_LIBELLES,
  TRACE_TYPE_LIBELLES,
  TRACE_TYPES,
  VALIDATION_ETAT_LIBELLES,
  VALIDATION_ETATS,
} from '../../../shared/utils/domaine'

describe('valeurs du domaine', () => {
  it('liste les types de trace dans l’ordre attendu', () => {
    expect(TRACE_TYPES).toEqual(['image', 'pdf', 'video', 'lien'])
  })

  it('liste les états de validation de 0 à 3', () => {
    expect(VALIDATION_ETATS).toEqual([0, 1, 2, 3])
  })

  it('donne un libellé non vide à chaque type de trace', () => {
    for (const type of TRACE_TYPES) {
      expect(TRACE_TYPE_LIBELLES[type].trim()).not.toBe('')
    }
  })

  it('donne un libellé non vide à chaque état de validation', () => {
    for (const etat of VALIDATION_ETATS) {
      expect(VALIDATION_ETAT_LIBELLES[etat].trim()).not.toBe('')
    }
    expect(VALIDATION_ETAT_LIBELLES[3]).toBe('Acquis')
  })

  // L'ancienne version plantait sur cette valeur, pourtant celle par défaut
  it('définit un libellé « Non renseigné » pour l’usage de l’IA', () => {
    expect(CONCEPTION_IA_LIBELLES.non_renseigne).toBe('Non renseigné')
    expect(REALISATION_IA_LIBELLES.non_renseigne).toBe('Non renseigné')
  })
})
