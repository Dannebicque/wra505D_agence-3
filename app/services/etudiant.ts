import type { Etudiant } from '#shared/types/utilisateur'
import { apiFetch } from './api'

export function getEtudiant(id: string | number): Promise<Etudiant> {
  return apiFetch<Etudiant>(iri('etudiants', id))
}
