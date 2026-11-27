import { registerEndpoint } from '@nuxt/test-utils/runtime'
import type { User } from '#shared/types/utilisateur'

/** Compte ouvert aux trois espaces : les tests de mise en page passent d'un espace à l'autre. */
export const UTILISATEUR_TOUS_ESPACES: User = {
  '@id': '/api/users/1',
  '@type': 'User',
  username: 'test',
  email: null,
  roles: ['ROLE_ETUDIANT', 'ROLE_ENSEIGNANT', 'ROLE_ADMIN'],
  etudiant: null,
  enseignant: null,
}

/**
 * Simule l'utilisateur connecté (`GET /api/me`), lu par le garde de route avant d'ouvrir une page
 * d'espace. À appeler au niveau du fichier de test, avant le premier montage.
 */
export function simulerConnexion(user: User = UTILISATEUR_TOUS_ESPACES) {
  registerEndpoint('/api/me', () => user)
}
