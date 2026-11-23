import { portfolioRepository } from '../../data/portfolio-repository'

// La page passe à la corbeille ; ses traces restent dans la bibliothèque de l'étudiant.
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const deleted = portfolioRepository.deletePage(
    event.context.demoSession,
    id,
    new Date().toISOString(),
  )
  if (!deleted) throw pageNotFound()

  setResponseStatus(event, 204)
  return null
})
