import { toApiError } from './errors'

type ApiFetchOptions = Parameters<typeof $fetch>[1]

/**
 * Seul point d'appel à l'API. `apiBase` est une origine (vide = routes Nitro locales) :
 * les chemins sont toujours complets (`/api/...`), ce qui permet d'appeler directement un IRI.
 * Toute erreur est relancée en `ApiError`, avec un message en français.
 */
export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { apiBase } = useRuntimeConfig().public

  try {
    // `string` en second paramètre : chemin quelconque, réponse typée par `T` (et non par les routes Nitro)
    return await $fetch<T, string>(path, {
      headers: { Accept: 'application/ld+json' },
      ...options,
      baseURL: apiBase,
    })
  } catch (error) {
    throw toApiError(error)
  }
}
