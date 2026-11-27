/**
 * Données factices (phase Nitro) : comptes de démonstration, mêmes identifiants et même mot de passe
 * (`test`) que les fixtures de l'API (backend/src/DataFixtures/UsersFixture.php), pour que les tests
 * et les démonstrations se connectent de la même façon sur Nitro et sur la vraie API.
 */
import type { User } from '../../shared/types/utilisateur'
import { iri } from '../../shared/utils/iri'

export interface CompteDemo {
  password: string
  user: User
}

const PASSWORD = 'test'

export const COMPTES: readonly CompteDemo[] = [
  {
    password: PASSWORD,
    user: {
      '@id': iri('users', 1),
      '@type': 'User',
      username: 'etudiant',
      email: 'lea.martin@etudiant.example',
      roles: ['ROLE_ETUDIANT'],
      etudiant: iri('etudiants', 1),
      enseignant: null,
    },
  },
  {
    password: PASSWORD,
    user: {
      '@id': iri('users', 2),
      '@type': 'User',
      username: 'enseignant',
      email: 'sophie.durand@univ.example',
      roles: ['ROLE_ENSEIGNANT'],
      etudiant: null,
      enseignant: iri('enseignants', 1),
    },
  },
  {
    password: PASSWORD,
    user: {
      '@id': iri('users', 3),
      '@type': 'User',
      username: 'admin',
      email: 'admin@univ.example',
      roles: ['ROLE_ADMIN'],
      etudiant: null,
      enseignant: null,
    },
  },
]

export function compteByUsername(username: string | undefined): CompteDemo | undefined {
  return COMPTES.find((compte) => compte.user.username === username)
}
