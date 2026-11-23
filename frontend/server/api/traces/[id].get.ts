import { traceRepository } from '../../data/trace-repository'

export default defineEventHandler((event) => {
  const trace = traceRepository.get(event.context.demoSession, getRouterParam(event, 'id') ?? '')
  if (!trace || trace.dateSuppression !== null) throw traceNotFound()
  return trace
})
