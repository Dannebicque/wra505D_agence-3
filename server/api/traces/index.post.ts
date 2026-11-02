import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler(async (event) => {
  const result = validateTrace(await readBody(event).catch(() => null), { today: todayInParis() })
  if (!result.ok) throw validationError(result.violations)

  const fileViolations = fileFieldViolations(null, result.value)
  if (fileViolations.length) throw validationError(fileViolations)

  const trace = traceRepository.create(
    event.context.demoSession,
    result.value,
    new Date().toISOString(),
  )
  if (!trace) {
    throw validationError([
      {
        propertyPath: '',
        message: 'Vous avez atteint le nombre maximal de traces de démonstration.',
      },
    ])
  }

  setResponseStatus(event, 201)
  return trace
})
