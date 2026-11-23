import { portfolioRepository } from '../../data/portfolio-repository'
import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler(async (event) => {
  const session = event.context.demoSession
  const id = getRouterParam(event, 'id') ?? ''
  const existing = portfolioRepository.getPage(session, id)
  if (!existing || existing.dateSuppression !== null) throw pageNotFound()

  const body = await readBody(event).catch(() => null)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw validationError([{ propertyPath: '', message: 'Page invalide.' }])
  }

  const info = validatePage(mergePagePatch(existing, body))
  if (!info.ok) throw validationError(info.violations)

  const traces = checkPageTraces(Object.hasOwn(body, 'traces') ? body.traces : existing.traces, {
    existing: existing.traces,
    available: traceRepository.list(session),
    otherPages: portfolioRepository
      .listPages(session, existing.portfolio)
      .filter((page) => page['@id'] !== existing['@id']),
  })
  if (!traces.ok) throw validationError(traces.violations)

  return portfolioRepository.updatePage(
    session,
    id,
    { ...info.value, traces: traces.value },
    new Date().toISOString(),
  )
})
