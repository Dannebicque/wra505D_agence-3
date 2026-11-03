import type { Trace, TraceInput } from '../../shared/types/trace'
import { iri } from '../../shared/utils/iri'
import { apiFetch, apiFetchAll, type ApiFetchOptions } from './api'

/** Traces de l'utilisateur, toutes pages confondues. */
export function listTraces(options?: ApiFetchOptions): Promise<Trace[]> {
  return apiFetchAll<Trace>('/api/traces', options)
}

export function getTrace(id: string | number, options?: ApiFetchOptions): Promise<Trace> {
  return apiFetch<Trace>(iri('traces', id), options)
}

export function createTrace(input: TraceInput): Promise<Trace> {
  return apiFetch<Trace>('/api/traces', { method: 'POST', body: input })
}

/** Modification partielle, au format attendu par ApiPlatform (merge-patch). */
export function updateTrace(id: string | number, input: Partial<TraceInput>): Promise<Trace> {
  return apiFetch<Trace>(iri('traces', id), {
    method: 'PATCH',
    body: input,
    headers: { 'Content-Type': 'application/merge-patch+json' },
  })
}
