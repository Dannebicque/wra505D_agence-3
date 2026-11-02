// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.

export type Espace = 'etudiant' | 'enseignant' | 'admin'

export interface NavItem {
  label: string
  to: string
  /** Icône Lucide (ex. `i-lucide-layout-dashboard`), facultative. */
  icon?: string
}

export const ESPACES: readonly Espace[] = ['etudiant', 'enseignant', 'admin']

export const ESPACE_LIBELLES: Record<Espace, string> = {
  etudiant: 'Espace étudiant',
  enseignant: 'Espace enseignant',
  admin: 'Administration',
}

/**
 * Navigation de chaque espace. N'y figurent que des pages qui existent :
 * chaque fonctionnalité ajoute sa ligne en même temps que sa page (un test le vérifie).
 */
export const NAVIGATION: Record<Espace, readonly NavItem[]> = {
  etudiant: [{ label: 'Tableau de bord', to: '/etudiant', icon: 'i-lucide-layout-dashboard' }],
  enseignant: [{ label: 'Tableau de bord', to: '/enseignant', icon: 'i-lucide-layout-dashboard' }],
  admin: [{ label: 'Tableau de bord', to: '/admin', icon: 'i-lucide-layout-dashboard' }],
}

/** Espace auquel appartient un chemin (`/etudiant` ou `/etudiant/...`), ou `null`. */
export function espaceFromPath(path: string): Espace | null {
  return ESPACES.find((espace) => path === `/${espace}` || path.startsWith(`/${espace}/`)) ?? null
}
