import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '../../../app/services/errors'

describe('toApiError', () => {
  it('reprend le message d’une erreur 4xx au format Nitro', () => {
    const error = toApiError({ statusCode: 404, data: { message: 'Référentiel introuvable.' } })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.message).toBe('Référentiel introuvable.')
  })

  it('reprend le détail d’une erreur 4xx au format ApiPlatform', () => {
    const error = toApiError({
      status: 422,
      data: { detail: 'titre: Cette valeur ne doit pas être vide.' },
    })

    expect(error.status).toBe(422)
    expect(error.message).toBe('titre: Cette valeur ne doit pas être vide.')
  })

  it('n’affiche jamais le message technique d’une erreur serveur', () => {
    const error = toApiError({
      statusCode: 500,
      data: { message: 'SQLSTATE[42S02] table absente' },
    })

    expect(error.status).toBe(500)
    expect(error.message).toBe('Le serveur a rencontré une erreur. Réessayez plus tard.')
  })

  it('signale une panne réseau quand aucune réponse n’est reçue', () => {
    const error = toApiError(new TypeError('fetch failed'))

    expect(error.status).toBe(0)
    expect(error.message).toBe('Impossible de joindre le serveur. Vérifiez votre connexion.')
  })

  it('utilise le message par défaut d’un 403 sans détail', () => {
    expect(toApiError({ statusCode: 403, data: {} }).message).toBe(
      'Vous n’avez pas accès à cette ressource.',
    )
  })

  it('utilise le message par défaut d’un 401, d’un 404 et d’un autre 4xx sans détail', () => {
    expect(toApiError({ statusCode: 401 }).message).toBe(
      'Vous devez vous connecter pour continuer.',
    )
    expect(toApiError({ statusCode: 404, data: { message: '  ' } }).message).toBe(
      'Ressource introuvable.',
    )
    expect(toApiError({ statusCode: 409 }).message).toBe('La requête n’a pas pu aboutir.')
  })
})
