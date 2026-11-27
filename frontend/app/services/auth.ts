import type { User } from '#shared/types/utilisateur'
import { apiFetch, type ApiFetchOptions } from './api'

export interface Credentials {
  username: string
  password: string
}

/** Ouvre la session (cookie HttpOnly posé par l'API). 401, 403 ou 429 : voir `loginErrorMessage`. */
export async function login(credentials: Credentials): Promise<void> {
  await apiFetch<null>('/api/login', { method: 'POST', body: credentials })
}

/** Utilisateur connecté ; `ApiError` 401 si personne ne l'est. */
export function getMe(options?: ApiFetchOptions): Promise<User> {
  return apiFetch<User>('/api/me', options)
}

export async function logout(): Promise<void> {
  await apiFetch<null>('/api/logout', { method: 'POST' })
}
