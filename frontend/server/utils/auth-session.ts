// Connexion simulée de la phase Nitro (doublure de l'API pour les tests et la CI, sans Docker).
// Fonctions pures, sans h3 : testables dans le projet Vitest `unit`. Le contrat imite l'API
// (`POST /api/login`, `GET /api/me`, `POST /api/logout`, `access_control` de security.yaml).
// Les rôles ne sont pas contrôlés route par route (un enseignant lit les traces factices) : ne pas
// s'y fier pour éprouver les droits, c'est l'API qui les tient.
import { isNuxtIconPath } from './api-proxy-url'

/** Cookie de session de la doublure (celui de l'API, géré par Symfony, s'appelle autrement). */
export const SESSION_COOKIE = 'uf_session'

/**
 * Sessions ouvertes en mémoire : identifiant aléatoire → identifiant de connexion. Bornées, comme
 * les données factices par visiteur : la plus ancienne est oubliée en premier.
 */
export function createSessionStore({ maxSessions = 500 } = {}) {
  const sessions = new Map<string, string>()

  return {
    open(username: string): string {
      const id = crypto.randomUUID()
      sessions.set(id, username)
      if (sessions.size > maxSessions) {
        const oldest = sessions.keys().next().value
        if (oldest !== undefined) sessions.delete(oldest)
      }
      return id
    },

    username(id: string | undefined): string | undefined {
      return id === undefined ? undefined : sessions.get(id)
    },

    close(id: string | undefined): void {
      if (id !== undefined) sessions.delete(id)
    },
  }
}

const PUBLIC_ROUTES: readonly { pattern: RegExp; methods?: readonly string[] }[] = [
  { pattern: /^\/api\/login$/ },
  // Symfony traite la déconnexion avant le contrôle d'accès : elle répond même sans session
  { pattern: /^\/api\/logout$/ },
  { pattern: /^\/api\/portfolios\/\d+\/public$/, methods: ['GET', 'HEAD'] },
  { pattern: /^\/api\/fichiers\/[0-9a-f-]+$/, methods: ['GET', 'HEAD'] },
]

/** Requête `/api/**` accessible sans connexion (même liste que l'`access_control` de l'API). */
export function isPublicApiRequest(path: string, method: string): boolean {
  const pathname = path.split('?')[0] ?? ''
  return PUBLIC_ROUTES.some(
    (route) => route.pattern.test(pathname) && (!route.methods || route.methods.includes(method)),
  )
}

/** Requête vers l'API (`/api` ou `/api/...`), et non vers une page ou les icônes du front. */
export function isApiRequest(path: string): boolean {
  const pathname = path.split('?')[0] ?? ''
  if (isNuxtIconPath(pathname)) return false
  return pathname === '/api' || pathname.startsWith('/api/')
}
