import { portfolioRepository } from '../../data/portfolio-repository'

export default defineEventHandler(async (event) => {
  const session = event.context.demoSession
  const body = await readBody(event).catch(() => null)

  const result = validatePage(body)
  if (!result.ok) throw validationError(result.violations)

  const portfolioIri: unknown = body.portfolio
  const portfolio = isIri(portfolioIri)
    ? portfolioRepository.getPortfolio(session, idFromIri(portfolioIri))
    : undefined
  if (!portfolio || portfolio['@id'] !== portfolioIri || portfolio.dateSuppression !== null) {
    throw validationError([{ propertyPath: 'portfolio', message: 'Portfolio introuvable.' }])
  }

  const page = portfolioRepository.createPage(
    session,
    portfolio['@id'],
    result.value,
    new Date().toISOString(),
  )
  if (!page) {
    throw validationError([
      {
        propertyPath: '',
        message: 'Vous avez atteint le nombre maximal de pages de démonstration.',
      },
    ])
  }

  setResponseStatus(event, 201)
  return page
})
