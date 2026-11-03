import { fileRepository } from '../../data/file-repository'

// Provisoire (phase Nitro) : sert un fichier, au seul visiteur qui l'a déposé
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const file = /^[0-9a-f-]{36}$/.test(id)
    ? await fileRepository.get(event.context.demoSession, id)
    : null
  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Fichier introuvable.',
    })
  }

  setResponseHeaders(event, {
    'content-type': MIME_TYPES[file.kind],
    'content-length': file.bytes.length,
    // Le navigateur ne devine jamais un autre type que celui déclaré
    'x-content-type-options': 'nosniff',
    'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fichier.nom)}`,
    'cache-control': 'private, max-age=3600',
    // Une image ouverte seule ne peut rien exécuter (le lecteur PDF du navigateur refuse `sandbox`)
    ...(file.kind === 'pdf' ? {} : { 'content-security-policy': "default-src 'none'; sandbox" }),
  })
  return Buffer.from(file.bytes)
})
