import type { Iri, JsonLdResource } from './api'

export type Role = 'ROLE_ETUDIANT' | 'ROLE_ENSEIGNANT' | 'ROLE_ADMIN'

/** Compte de connexion, lié à un étudiant ou à un enseignant. */
export interface User extends JsonLdResource {
  '@type': 'User'
  username: string
  /** Absente pour certains comptes (l'administrateur des fixtures n'en a pas). */
  email: string | null
  roles: Role[]
  etudiant: Iri | null
  enseignant: Iri | null
}

export interface Etudiant extends JsonLdResource {
  '@type': 'Etudiant'
  prenom: string
  nom: string
  mailUniv: string
  semestre: Iri | null
  groupes: Iri[]
  anneeUniversitaire: Iri | null
  user: Iri
}

export interface Enseignant extends JsonLdResource {
  '@type': 'Enseignant'
  prenom: string
  nom: string
  mailUniv: string
  departements: Iri[]
  user: Iri
}
