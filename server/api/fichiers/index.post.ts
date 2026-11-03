import { fileRepository } from '../../data/file-repository'

// Provisoire (phase Nitro) : téléversement d'un fichier de trace, contrôlé sur son contenu réel
const MAX_BODY = FILE_RULES.pdf.maxBytes + 64 * 1024

const fail = (message: string) => validationError([{ propertyPath: 'fichier', message }])

export default defineEventHandler(async (event) => {
  // Refus avant lecture du corps : un envoi énorme, ou de taille inconnue (envoi « chunked »),
  // n'est jamais chargé en mémoire. Les navigateurs envoient toujours la taille d'un FormData.
  const length = Number(getRequestHeader(event, 'content-length'))
  if (!Number.isFinite(length) || length <= 0) {
    throw createError({
      statusCode: 411,
      statusMessage: 'Length Required',
      message: 'Taille de l’envoi requise.',
    })
  }
  if (length > MAX_BODY) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: 'Le fichier dépasse la taille maximale (10 Mo).',
    })
  }

  const parts = await readMultipartFormData(event).catch(() => undefined)
  const file = parts?.find((part) => part.name === 'fichier' && part.filename)
  const type = parts?.find((part) => part.name === 'type')?.data.toString()
  if (!file || (type !== 'image' && type !== 'pdf')) throw fail('Choisissez un fichier.')

  const bytes = new Uint8Array(file.data)
  const kind = detectFileKind(bytes)
  const problem = checkFile(type, { size: bytes.length, kind })
  if (problem || !kind) throw fail(problem ?? FILE_RULES[type].wrongKind)

  const saved = await fileRepository.save(event.context.demoSession, {
    name: file.filename ?? 'fichier',
    kind,
    bytes,
  })
  if ('error' in saved) throw fail(saved.error)

  setResponseStatus(event, 201)
  return saved
})
