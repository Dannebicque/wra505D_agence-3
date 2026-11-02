import type { HydraCollection } from '#shared/types/api'
import type { Trace } from '#shared/types/trace'
import { apiFetch } from './api'

/** Traces de l'utilisateur (première page de la collection). */
export async function listTraces(): Promise<Trace[]> {
  const collection = await apiFetch<HydraCollection<Trace>>('/api/traces')
  return collection.member
}
