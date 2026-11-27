import type { HydraCollection } from '../../shared/types/api'
import { toApiError } from './errors'

export type ApiFetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

/**
 * Origine de l'API (vide = routes Nitro locales), fixée au démarrage par `plugins/api.ts`.
 * Elle est gardée ici, et non lue via `useRuntimeConfig()` à chaque appel : pendant le rendu
 * serveur, le contexte Nuxt est perdu après un `await` et `useRuntimeConfig()` lèverait une erreur.
 * La valeur est identique pour toutes les requêtes (configuration publique), le partage est donc sans risque.
 */
let apiBase = ''

export function setApiBase(base: string): void {
  apiBase = base
}

/**
 * Réaction à une session expirée (401 sur un appel autre que la connexion), posée par
 * `plugins/session-expiree.client.ts`. Navigateur seulement : côté serveur, ce module est partagé
 * entre toutes les requêtes, une fonction liée à une application n'y a pas sa place.
 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/** Appels dont le 401 est une réponse attendue, traitée par l'appelant (store `auth`). */
const AUTH_PATHS = new Set(['/api/login', '/api/me'])

/**
 * Seul point d'appel à l'API. Les chemins sont toujours complets (`/api/...`),
 * ce qui permet d'appeler directement un IRI. Toute erreur est relancée en `ApiError`,
 * avec un message en français.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  try {
    // Les en-têtes de l'appelant sont conservés ; JSON-LD par défaut (sinon ApiPlatform
    // répond en JSON simple, sans `@id` ni `member`)
    const headers = new Headers(options.headers)
    if (!headers.has('accept')) headers.set('accept', 'application/ld+json')

    // `string` en second paramètre : chemin quelconque, réponse typée par `T` (et non par les routes Nitro)
    return await $fetch<T, string>(path, { ...options, headers, baseURL: apiBase })
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.status === 401 && !AUTH_PATHS.has(path.split('?')[0] ?? '')) onUnauthorized?.()
    throw apiError
  }
}

/**
 * Tous les éléments d'une collection, en suivant la pagination (`view.next`) :
 * ApiPlatform pagine par 30, un calcul sur la seule première page serait faux.
 */
export async function apiFetchAll<T>(path: string, options?: ApiFetchOptions): Promise<T[]> {
  const items: T[] = []
  let next: string | undefined = path
  while (next) {
    const page: HydraCollection<T> = await apiFetch<HydraCollection<T>>(next, options)
    items.push(...page.member)
    next = page.view?.next
  }
  return items
}
