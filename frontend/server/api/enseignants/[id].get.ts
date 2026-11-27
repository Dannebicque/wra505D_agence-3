import { ENSEIGNANTS } from '../../data/enseignants'

export default defineEventHandler((event) => {
  const enseignant = findByIri(ENSEIGNANTS, iri('enseignants', getRouterParam(event, 'id') ?? ''))

  if (!enseignant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Enseignant introuvable.',
    })
  }

  return enseignant
})
