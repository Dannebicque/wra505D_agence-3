// Règle d'adresse du relais /api/** (server/middleware/api-proxy.ts). Fonction pure, testable sans h3.

/** Envoi le plus gros accepté par l'API : un PDF de 10 Mo et la marge du formulaire multipart. */
export const API_PROXY_MAX_BYTES = 11 * 1024 * 1024

/**
 * Adresse de l'API pour un chemin demandé au front, ou `null` s'il ne doit pas être relayé.
 * Le chemin est normalisé d'abord : `/api/../index.php` ou `/api/%2e%2e/` ne sortent pas de `/api/`.
 */
export function apiProxyTarget(path: string, cible: string): string | null {
  if (!cible) return null
  let url: URL
  try {
    url = new URL(path, cible)
  } catch {
    return null
  }
  const origine = new URL(cible).origin
  if (url.origin !== origine || !url.pathname.startsWith('/api/')) return null
  return url.href
}
