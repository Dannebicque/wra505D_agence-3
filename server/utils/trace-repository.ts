// Dépôt de traces en mémoire pour la phase Nitro (provisoire, remplacé par ApiPlatform au Sprint 4).
// Chaque visiteur (cookie de démo) a sa propre copie des données : les démonstrations et les tests
// en parallèle ne se marchent pas dessus. Module pur, sans h3 : testable dans le projet `unit`.
import type { Trace, TraceInput } from '../../shared/types/trace'
import { idFromIri, iri } from '../../shared/utils/iri'

const BIBLIOTHEQUE = iri('bibliotheques', 1)

export function createTraceRepository(
  seed: readonly Trace[],
  { maxSessions = 500, maxTraces = 200 } = {},
) {
  const sessions = new Map<string, Trace[]>()

  function tracesOf(session: string): Trace[] {
    let traces = sessions.get(session)
    if (traces) {
      // Visiteur actif : remis en fin de file (le plus ancien est oublié en premier)
      sessions.delete(session)
    } else {
      traces = structuredClone([...seed])
    }
    sessions.set(session, traces)
    if (sessions.size > maxSessions) {
      const oldest = sessions.keys().next().value
      if (oldest !== undefined) sessions.delete(oldest)
    }
    return traces
  }

  const find = (traces: Trace[], id: string) => traces.find((t) => idFromIri(t['@id']) === id)

  return {
    list(session: string): Trace[] {
      return tracesOf(session).filter((t) => t.dateSuppression === null)
    },

    get(session: string, id: string): Trace | undefined {
      return find(tracesOf(session), id)
    },

    /** Renvoie `undefined` si le visiteur a atteint le nombre maximal de traces (mémoire bornée). */
    create(session: string, input: TraceInput, now: string): Trace | undefined {
      const traces = tracesOf(session)
      if (traces.length >= maxTraces) return undefined
      const nextId = Math.max(0, ...traces.map((t) => Number(idFromIri(t['@id'])) || 0)) + 1
      const trace: Trace = {
        ...input,
        '@id': iri('traces', nextId),
        '@type': 'Trace',
        bibliotheque: BIBLIOTHEQUE,
        legende: null,
        dateCreation: now,
        dateModification: now,
        dateSuppression: null,
      }
      traces.push(trace)
      return trace
    },

    update(session: string, id: string, input: TraceInput, now: string): Trace | undefined {
      const trace = find(tracesOf(session), id)
      if (!trace) return undefined
      Object.assign(trace, input, { dateModification: now })
      return trace
    },
  }
}
