/**
 * Données factices (phase Nitro). Provisoire : validations des traces de l'étudiante de démo
 * (niveau 2 de chaque compétence du référentiel factice : niveaux 2, 5, 8, 11 et 14).
 * Total des traces finalisées : 3 acquis, 2 en cours, 1 non acquis, 2 en attente.
 */
import type { Validation, ValidationEtat } from '../../shared/types/evaluation'
import { iri } from '../../shared/utils/iri'

const NIVEAU_2 = {
  comprendre: iri('niveaux', 2),
  concevoir: iri('niveaux', 5),
  exprimer: iri('niveaux', 8),
  developper: iri('niveaux', 11),
  entreprendre: iri('niveaux', 14),
}

let id = 0
function validation(
  trace: number,
  niveau: keyof typeof NIVEAU_2,
  etat: ValidationEtat,
): Validation {
  return {
    '@id': iri('validations', ++id),
    '@type': 'Validation',
    trace: iri('traces', trace),
    niveau: NIVEAU_2[niveau],
    enseignant: etat === 0 ? null : iri('enseignants', 1),
    etat,
    dateCreation: '2026-10-25',
    dateModification: etat === 0 ? null : '2026-10-31',
  }
}

export const VALIDATIONS: readonly Validation[] = [
  validation(1, 'developper', 3),
  validation(1, 'concevoir', 2),
  validation(2, 'exprimer', 3),
  validation(3, 'comprendre', 0),
  validation(4, 'exprimer', 0),
  validation(5, 'developper', 1),
  validation(6, 'exprimer', 2),
  validation(6, 'concevoir', 3),
  // Brouillons : compétences associées, pas encore soumis
  validation(7, 'entreprendre', 0),
  validation(8, 'comprendre', 0),
]
