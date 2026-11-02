import type { TraceInput } from '#shared/types/trace'
import { traceRepository } from '../../data/trace-repository'

// Champs modifiables : tout autre champ envoyé (dates, IRI…) est ignoré
const EDITABLE: readonly (keyof TraceInput)[] = [
  'titre',
  'description',
  'contexte',
  'type',
  'contenu',
  'statut',
  'conceptionIa',
  'realisationIa',
  'dateRealisation',
]

export default defineEventHandler(async (event) => {
  const session = event.context.demoSession
  const id = getRouterParam(event, 'id') ?? ''
  const existing = traceRepository.get(session, id)
  if (!existing || existing.dateSuppression !== null) throw traceNotFound()

  const body = await readBody(event).catch(() => null)
  if (typeof body !== 'object' || body === null) {
    throw validationError([{ propertyPath: '', message: 'Trace invalide.' }])
  }
  // Fusion à la manière d'un PATCH « merge-patch » : seuls les champs envoyés changent
  const merged = Object.fromEntries(
    EDITABLE.map((key) => [
      key,
      key in body ? (body as Record<string, unknown>)[key] : existing[key],
    ]),
  )
  const result = validateTrace(merged, { today: todayInParis() })
  if (!result.ok) throw validationError(result.violations)

  return traceRepository.update(session, id, result.value, new Date().toISOString())
})
