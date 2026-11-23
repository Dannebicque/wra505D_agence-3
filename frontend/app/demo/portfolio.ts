/**
 * Données et règles de DÉMONSTRATION propres aux maquettes du portfolio (E-PF, E-PG, E-TR-08).
 *
 * Provisoire, comme `base.ts` : quand les pages seront branchées, ces règles passeront dans le
 * store du portfolio et dans les routes de l'API (le serveur reste seul juge de la visibilité).
 */
import type { PortfolioVisibilite } from '../../shared/types/portfolio'
import { PORTFOLIOS, type DemoPageProjet, type DemoPortfolio } from './base'

/** Saisie du formulaire d'un portfolio (création E-PF-01, modification E-PF-02 et E-PF-03). */
export interface DemoPortfolioForm {
  intitule: string
  description: string
  visibilite: PortfolioVisibilite
  visibleRecruteurs: boolean
}

/** Année universitaire en cours (E-PF-10 : un seul portfolio par année). */
export const ANNEE_COURANTE = '2026-2027'

/** Bannière : formats et poids acceptés par le champ de dépôt. */
export const BANNIERE_RULES = {
  accept: 'image/jpeg,image/png,image/webp',
  maxBytes: 2 * 1024 * 1024,
  formats: 'JPEG, PNG ou WebP, 2 Mo au plus. Format paysage conseillé (1600 × 400 pixels).',
} as const

/** Limites de saisie des formulaires du portfolio et de ses pages. */
export const PORTFOLIO_LIMITS = {
  intitule: 100,
  description: 1000,
  pageIntitule: 100,
  pageDescription: 500,
} as const

export function portfolioById(id: number): DemoPortfolio | undefined {
  return PORTFOLIOS.find((p) => p.id === id)
}

export function portfolioBySlug(slug: string): DemoPortfolio | undefined {
  return PORTFOLIOS.find((p) => p.slug === slug)
}

export function pageProjetById(
  portfolio: DemoPortfolio,
  pageId: number,
): DemoPageProjet | undefined {
  return portfolio.pages.find((page) => page.id === pageId)
}

/** Un portfolio n'est accessible par son lien public que s'il est public ET publié (E-PF-06). */
export function isPubliclyVisible(portfolio: Pick<DemoPortfolio, 'visibilite' | 'publie'>) {
  return portfolio.visibilite === 'publique' && portfolio.publie
}

/** Chemin de la page publique d'un portfolio. */
export function publicPath(portfolio: Pick<DemoPortfolio, 'slug'>): string {
  return `/portfolio/${portfolio.slug}`
}

/** Identifiant numérique lu dans un paramètre de route (`NaN` s'il n'en est pas un). */
export function numericParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && /^\d+$/.test(raw) ? Number(raw) : Number.NaN
}
