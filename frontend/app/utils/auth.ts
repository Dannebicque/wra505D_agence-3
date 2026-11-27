// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.
import type { Role } from '../../shared/types/utilisateur'
import { espaceFromPath, type Espace } from './navigation'

/** Rôle qui ouvre chaque espace. Le serveur contrôle toujours : ce n'est qu'un confort de navigation. */
export const ESPACE_ROLES: Record<Espace, Role> = {
  etudiant: 'ROLE_ETUDIANT',
  enseignant: 'ROLE_ENSEIGNANT',
  admin: 'ROLE_ADMIN',
}

/** Espace ouvert après la connexion : celui du travail courant d'abord, l'administration en dernier. */
const ESPACE_PRIORITY: readonly Espace[] = ['etudiant', 'enseignant', 'admin']

export function canAccessEspace(roles: readonly Role[], espace: Espace): boolean {
  return roles.includes(ESPACE_ROLES[espace])
}

/** Espace d'accueil d'un utilisateur, ou `null` s'il n'a aucun rôle connu. */
export function homeEspace(roles: readonly Role[]): Espace | null {
  return ESPACE_PRIORITY.find((espace) => canAccessEspace(roles, espace)) ?? null
}

/**
 * Adresse de retour après la connexion (`?redirect=`), seulement si elle reste sur le site : un
 * chemin absolu, jamais `//autre-site` ni `/\autre-site` (lus comme une autre origine par le
 * navigateur), sinon une page de connexion piégée renverrait l'utilisateur ailleurs.
 */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  // Caractères de contrôle (tabulation, retour à la ligne) : ignorés par le navigateur dans une URL
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return null
  return value
}

/**
 * Page ouverte après la connexion : l'adresse demandée (`?redirect=`) si elle est sûre et dans un
 * espace permis à l'utilisateur, sinon l'accueil de son espace. Jamais la page de connexion
 * elle-même (boucle), ni un espace refusé (le garde le renverrait aussitôt ailleurs).
 */
export function pathAfterLogin(roles: readonly Role[], redirect: unknown): string | null {
  const target = safeRedirect(redirect)
  const espace = target ? espaceFromPath(target) : null
  if (target && espace && canAccessEspace(roles, espace)) return target
  const home = homeEspace(roles)
  return home ? `/${home}` : null
}

/** Messages de la connexion, selon la réponse de `POST /api/login`. */
export const LOGIN_MESSAGES = {
  401: 'Identifiant ou mot de passe incorrect.',
  403: 'Votre compte n’est pas encore activé : vérifiez votre adresse mail.',
  429: 'Trop de tentatives de connexion. Réessayez dans une minute.',
} as const

export function loginErrorMessage(status: number, fallback: string): string {
  return LOGIN_MESSAGES[status as keyof typeof LOGIN_MESSAGES] ?? fallback
}
