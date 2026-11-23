import { portfolioRepository } from '../../data/portfolio-repository'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const page = portfolioRepository.getPage(event.context.demoSession, id)
  if (!page || page.dateSuppression !== null) throw pageNotFound()
  return page
})
