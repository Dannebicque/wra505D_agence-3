import { toApiError } from './errors'

type ApiFetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

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
    throw toApiError(error)
  }
}
