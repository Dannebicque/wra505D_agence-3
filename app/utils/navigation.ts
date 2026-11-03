// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.

export type Espace = 'etudiant' | 'enseignant' | 'admin'

export interface NavItem {
  label: string
  to: string
  /** Icône Lucide (ex. `i-lucide-layout-dashboard`), facultative. */
  icon?: string
}

export const ESPACES: readonly Espace[] = ['etudiant', 'enseignant', 'admin']

export const ESPACE_LABELS: Record<Espace, string> = {
  etudiant: 'Espace étudiant',
  enseignant: 'Espace enseignant',
  admin: 'Administration',
}

/**
 * Navigation de chaque espace. N'y figurent que des pages qui existent :
 * chaque fonctionnalité ajoute sa ligne en même temps que sa page (un test le vérifie).
 */
export const NAVIGATION: Record<Espace, readonly NavItem[]> = {
  etudiant: [
    { label: 'Tableau de bord', to: '/etudiant', icon: 'i-lucide-layout-dashboard' },
    { label: 'Mes traces', to: '/etudiant/traces', icon: 'i-lucide-files' },
    { label: 'Portfolios', to: '/etudiant/portfolios', icon: 'i-lucide-book-open' },
    { label: 'Compétences', to: '/etudiant/competences', icon: 'i-lucide-graduation-cap' },
    { label: 'Retours', to: '/etudiant/retours', icon: 'i-lucide-inbox' },
    { label: 'Mon CV', to: '/etudiant/cv', icon: 'i-lucide-file-user' },
    { label: 'Corbeille', to: '/etudiant/corbeille', icon: 'i-lucide-trash-2' },
  ],
  enseignant: [
    { label: 'Tableau de bord', to: '/enseignant', icon: 'i-lucide-layout-dashboard' },
    { label: 'Traces à évaluer', to: '/enseignant/evaluations', icon: 'i-lucide-list-checks' },
    { label: 'Étudiants', to: '/enseignant/etudiants', icon: 'i-lucide-users' },
    { label: 'Bilans', to: '/enseignant/bilans', icon: 'i-lucide-chart-column' },
  ],
  admin: [{ label: 'Tableau de bord', to: '/admin', icon: 'i-lucide-layout-dashboard' }],
}

/** Espace auquel appartient un chemin (`/etudiant` ou `/etudiant/...`), ou `null`. */
export function espaceFromPath(path: string): Espace | null {
  return ESPACES.find((espace) => path === `/${espace}` || path.startsWith(`/${espace}/`)) ?? null
}
