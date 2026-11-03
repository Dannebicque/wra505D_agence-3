import type { Etudiant } from '#shared/types/utilisateur'
import { apiFetch, type ApiFetchOptions } from './api'

export function getEtudiant(id: string | number, options?: ApiFetchOptions): Promise<Etudiant> {
  return apiFetch<Etudiant>(iri('etudiants', id), options)
}
