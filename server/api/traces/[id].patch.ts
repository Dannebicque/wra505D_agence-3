import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler(async (event) => {
  const session = event.context.demoSession
  const id = getRouterParam(event, 'id') ?? ''
  const existing = traceRepository.get(session, id)
  if (!existing || existing.dateSuppression !== null) throw traceNotFound()

  const body = await readBody(event).catch(() => null)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw validationError([{ propertyPath: '', message: 'Trace invalide.' }])
  }

  const result = validateTrace(mergeTracePatch(existing, body), { today: todayInParis() })
  if (!result.ok) throw validationError(result.violations)

  const fileViolations = fileFieldViolations(existing, result.value)
  if (fileViolations.length) throw validationError(fileViolations)

  return traceRepository.update(session, id, result.value, new Date().toISOString())
})
