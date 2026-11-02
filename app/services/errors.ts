// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.

/** Erreur d'appel à l'API, avec un message affichable tel quel à l'utilisateur. */
export class ApiError extends Error {
  /** Code HTTP, ou 0 si aucune réponse n'a été reçue (panne réseau). */
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const MESSAGE_RESEAU = 'Impossible de joindre le serveur. Vérifiez votre connexion.'
const MESSAGE_SERVEUR = 'Le serveur a rencontré une erreur. Réessayez plus tard.'
const MESSAGE_REQUETE = 'La requête n’a pas pu aboutir.'
const MESSAGES_PAR_STATUT: Record<number, string> = {
  401: 'Vous devez vous connecter pour continuer.',
  403: 'Vous n’avez pas accès à cette ressource.',
  404: 'Ressource introuvable.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStatus(error: Record<string, unknown>): number {
  const status = error.statusCode ?? error.status
  return typeof status === 'number' ? status : 0
}

/** Message renvoyé par le serveur : `detail` (ApiPlatform) puis `message` (Nitro). */
function readServerMessage(error: Record<string, unknown>): string | undefined {
  const data = error.data
  if (!isRecord(data)) return undefined
  return [data.detail, data.message].find(
    (value): value is string => typeof value === 'string' && value.trim() !== '',
  )
}

function defaultMessage(status: number): string {
  if (status === 0) return MESSAGE_RESEAU
  if (status >= 500) return MESSAGE_SERVEUR
  return MESSAGES_PAR_STATUT[status] ?? MESSAGE_REQUETE
}

/**
 * Convertit n'importe quelle erreur d'appel en `ApiError`.
 * Le message du serveur n'est repris que pour les erreurs 4xx : celui d'une erreur 5xx
 * peut contenir des détails techniques à ne pas montrer.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  const status = isRecord(error) ? readStatus(error) : 0
  const serverMessage = isRecord(error) ? readServerMessage(error) : undefined
  const isClientError = status >= 400 && status < 500

  return new ApiError(status, (isClientError && serverMessage) || defaultMessage(status))
}
