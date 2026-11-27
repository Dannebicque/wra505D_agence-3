// Règle d'adresse du relais /api/** (server/middleware/api-proxy.ts). Fonction pure, testable sans h3.

/** Envoi le plus gros accepté par l'API : un PDF de 10 Mo et la marge du formulaire multipart. */
export const API_PROXY_MAX_BYTES = 11 * 1024 * 1024

/**
 * Icônes servies par le front lui-même (`@nuxt/icon`, `localApiEndpoint` par défaut) : sous `/api/`,
 * mais ce n'est pas l'API. Ni relayées, ni soumises à la connexion.
 */
export const NUXT_ICON_ENDPOINT = '/api/_nuxt_icon'

/** Chemin des icônes de `@nuxt/icon` (`/api/_nuxt_icon/…`). */
export function isNuxtIconPath(pathname: string): boolean {
  return pathname === NUXT_ICON_ENDPOINT || pathname.startsWith(`${NUXT_ICON_ENDPOINT}/`)
}

/**
 * Adresse de l'API pour un chemin demandé au front, ou `null` s'il ne doit pas être relayé.
 * Le chemin est normalisé d'abord : `/api/../index.php` ou `/api/%2e%2e/` ne sortent pas de `/api/`. Un chemin encore
 * encodé après normalisation (`%2f`, `%5c`, `%2e`) est refusé, et `cible` doit être une origine seule
 * (`http://localhost:8000`, sans chemin).
 */
export function apiProxyTarget(path: string, cible: string): string | null {
  if (!cible) return null
  let url: URL
  try {
    url = new URL(path, cible)
  } catch {
    return null
  }
  const base = new URL(cible)
  if (base.pathname !== '/' || url.origin !== base.origin) return null
  if (!url.pathname.startsWith('/api/') || /%(2f|5c|2e)/i.test(url.pathname)) return null
  if (isNuxtIconPath(url.pathname)) return null
  return url.href
}
