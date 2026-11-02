import type { Trace } from '#shared/types/trace'
import { apiFetchAll } from './api'

/** Traces de l'utilisateur, toutes pages confondues. */
export function listTraces(): Promise<Trace[]> {
  return apiFetchAll<Trace>('/api/traces')
}
