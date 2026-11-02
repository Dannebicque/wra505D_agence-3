import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler(async (event) => {
  const result = validateTrace(await readBody(event).catch(() => null), { today: todayInParis() })
  if (!result.ok) throw validationError(result.violations)

  setResponseStatus(event, 201)
  return traceRepository.create(event.context.demoSession, result.value, new Date().toISOString())
})
