import { portfolioRepository } from '../../data/portfolio-repository'

// Provisoire : pages du visiteur (cookie de démo), hors corbeille, filtrées par `?portfolio=<IRI>`
// comme le ferait un filtre ApiPlatform.
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const portfolio = isIri(query.portfolio) ? query.portfolio : undefined
  const path = portfolio ? `/api/pages?portfolio=${encodeURIComponent(portfolio)}` : '/api/pages'
  return toCollection(
    path,
    portfolioRepository.listPages(event.context.demoSession, portfolio),
    query,
  )
})
