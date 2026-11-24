import type { HydraCollection } from '#shared/types/api'
import type { Referentiel } from '#shared/types/referentiel'
import { apiFetch, type ApiFetchOptions } from './api'

/** Référentiels de compétences (première page de la collection). */
export async function listReferentiels(options?: ApiFetchOptions): Promise<Referentiel[]> {
  const collection = await apiFetch<HydraCollection<Referentiel>>('/api/referentiels', options)
  return collection.member
}

export function getReferentiel(
  id: string | number,
  options?: ApiFetchOptions,
): Promise<Referentiel> {
  return apiFetch<Referentiel>(iri('referentiels', id), options)
}
