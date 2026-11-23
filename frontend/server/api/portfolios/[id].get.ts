import { portfolioRepository } from '../../data/portfolio-repository'

// Provisoire : portfolio du visiteur (cookie de démo), hors corbeille.
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const portfolio = portfolioRepository.getPortfolio(event.context.demoSession, id)
  if (!portfolio || portfolio.dateSuppression !== null) throw portfolioNotFound()
  return portfolio
})
