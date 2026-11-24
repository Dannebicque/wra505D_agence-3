// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.

export type Espace = 'etudiant' | 'enseignant' | 'admin'

export interface NavItem {
  label: string
  to: string
  /** Icône Lucide (ex. `i-lucide-layout-dashboard`), facultative. */
  icon?: string
  /** Intitulé du groupe de la barre latérale ; les entrées voisines du même groupe vont ensemble. */
  groupe?: string
  /** Rangée en bas de la barre latérale, à l'écart du travail courant (la corbeille). */
  enBas?: boolean
}

/** Groupe de la barre latérale : entrées voisines de même intitulé et de même place. */
export interface NavGroupe {
  label?: string
  enBas: boolean
  items: NavItem[]
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
    { label: 'Mes traces', to: '/etudiant/traces', icon: 'i-lucide-files', groupe: 'Mon travail' },
    {
      label: 'Portfolios',
      to: '/etudiant/portfolios',
      icon: 'i-lucide-book-open',
      groupe: 'Mon travail',
    },
    { label: 'Mon CV', to: '/etudiant/cv', icon: 'i-lucide-file-user', groupe: 'Mon travail' },
    {
      label: 'Compétences',
      to: '/etudiant/competences',
      icon: 'i-lucide-graduation-cap',
      groupe: 'Mon suivi',
    },
    { label: 'Retours', to: '/etudiant/retours', icon: 'i-lucide-inbox', groupe: 'Mon suivi' },
    { label: 'Corbeille', to: '/etudiant/corbeille', icon: 'i-lucide-trash-2', enBas: true },
  ],
  enseignant: [
    { label: 'Tableau de bord', to: '/enseignant', icon: 'i-lucide-layout-dashboard' },
    {
      label: 'Traces à évaluer',
      to: '/enseignant/evaluations',
      icon: 'i-lucide-list-checks',
      groupe: 'Évaluer',
    },
    { label: 'Étudiants', to: '/enseignant/etudiants', icon: 'i-lucide-users', groupe: 'Suivre' },
    { label: 'Bilans', to: '/enseignant/bilans', icon: 'i-lucide-chart-column', groupe: 'Suivre' },
  ],
  admin: [{ label: 'Tableau de bord', to: '/admin', icon: 'i-lucide-layout-dashboard' }],
}

/** Espace auquel appartient un chemin (`/etudiant` ou `/etudiant/...`), ou `null`. */
export function espaceFromPath(path: string): Espace | null {
  return ESPACES.find((espace) => path === `/${espace}` || path.startsWith(`/${espace}/`)) ?? null
}

/**
 * Découpe la navigation d'un espace en groupes pour la barre latérale : les entrées voisines de même
 * `groupe` et de même place (`enBas`) vont ensemble, dans l'ordre de la liste. Les groupes du bas
 * sont rangés à la fin, quelle que soit leur position dans la liste.
 */
export function navigationGroupes(items: readonly NavItem[]): NavGroupe[] {
  const groupes: NavGroupe[] = []
  for (const item of items) {
    const enBas = item.enBas === true
    const last = groupes.at(-1)
    if (last && last.enBas === enBas && last.label === item.groupe) last.items.push(item)
    else groupes.push({ label: item.groupe, enBas, items: [item] })
  }
  return [...groupes.filter((g) => !g.enBas), ...groupes.filter((g) => g.enBas)]
}
