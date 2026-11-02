import type { HydraCollection } from '#shared/types/api'
import type { Referentiel } from '#shared/types/referentiel'
import { apiFetch } from './api'

/** Référentiels de compétences (première page de la collection). */
export async function listReferentiels(): Promise<Referentiel[]> {
  const collection = await apiFetch<HydraCollection<Referentiel>>('/api/referentiels')
  return collection.member
}

export function getReferentiel(id: string | number): Promise<Referentiel> {
  return apiFetch<Referentiel>(iri('referentiels', id))
}
