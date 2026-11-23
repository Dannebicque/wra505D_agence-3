import { portfolioRepository } from '../../data/portfolio-repository'

// Provisoire : seul l'ordre des pages se modifie ici. Les informations et la publication du
// portfolio arriveront avec leur propre lot.
export default defineEventHandler(async (event) => {
  const session = event.context.demoSession
  const id = getRouterParam(event, 'id') ?? ''
  const portfolio = portfolioRepository.getPortfolio(session, id)
  if (!portfolio || portfolio.dateSuppression !== null) throw portfolioNotFound()

  const body = await readBody(event).catch(() => null)
  const result = checkPageOrder(portfolio.pages, body?.pages)
  if (!result.ok) throw validationError(result.violations)

  return portfolioRepository.setPageOrder(session, id, result.value, new Date().toISOString())
})
