/**
 * Données factices (phase Nitro). Provisoire : l'étudiante de démo du tableau de bord,
 * en attendant les données utilisateurs du back (Mathéo) et la connexion (Solène).
 */
import type { Etudiant } from '../../shared/types/utilisateur'
import { iri } from '../../shared/utils/iri'

export const ETUDIANTS: readonly Etudiant[] = [
  {
    '@id': iri('etudiants', 1),
    '@type': 'Etudiant',
    prenom: 'Léa',
    nom: 'Martin',
    mailUniv: 'lea.martin@etudiant.example',
    semestre: null,
    groupes: [],
    anneeUniversitaire: null,
    user: iri('users', 1),
  },
]
