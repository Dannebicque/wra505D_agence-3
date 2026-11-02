import { ETUDIANTS } from '../../data/etudiants'

export default defineEventHandler((event) => {
  const etudiant = findByIri(ETUDIANTS, iri('etudiants', getRouterParam(event, 'id') ?? ''))

  if (!etudiant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Étudiant introuvable.',
    })
  }

  return etudiant
})
