import type { Enseignant } from '#shared/types/utilisateur'
import { apiFetch, type ApiFetchOptions } from './api'

export function getEnseignant(id: string | number, options?: ApiFetchOptions): Promise<Enseignant> {
  return apiFetch<Enseignant>(iri('enseignants', id), options)
}
