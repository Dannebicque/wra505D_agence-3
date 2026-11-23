import { fileRepository } from '../../data/file-repository'
import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler(async (event) => {
  const result = validateTrace(await readBody(event).catch(() => null), { today: todayInParis() })
  if (!result.ok) throw validationError(result.violations)

  const fileId = uploadedFileId(result.value.contenu)
  const owned = fileId ? await fileRepository.get(event.context.demoSession, fileId) : null
  const fileViolations = fileFieldViolations(null, result.value, owned?.kind ?? null)
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
