/**
 * Données factices (phase Nitro) : l'enseignante du compte de démonstration `enseignant`
 * (même nom que dans les fixtures de l'API).
 */
import type { Enseignant } from '../../shared/types/utilisateur'
import { iri } from '../../shared/utils/iri'

export const ENSEIGNANTS: readonly Enseignant[] = [
  {
    '@id': iri('enseignants', 1),
    '@type': 'Enseignant',
    prenom: 'Sophie',
    nom: 'Durand',
    mailUniv: 'sophie.durand@univ.example',
    departements: [],
    user: iri('users', 2),
  },
]
