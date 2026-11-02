import { REFERENTIELS } from '../../data/referentiels'

export default defineEventHandler((event) => {
  const referentiel = findByIri(
    REFERENTIELS,
    iri('referentiels', getRouterParam(event, 'id') ?? ''),
  )

  if (!referentiel) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Référentiel introuvable.',
    })
  }

  return referentiel
})
