/**
 * Données factices (phase Nitro). Provisoire : les portfolios de l'étudiante de démo, identiques à
 * la maquette (`app/demo/base.ts`, un test le vérifie) ; à reprendre par le back.
 */
import type { Page, Portfolio } from '../../shared/types/portfolio'
import { iri } from '../../shared/utils/iri'

function page(
  id: number,
  portfolio: number,
  intitule: string,
  description: string,
  traces: number[],
): Page {
  return {
    '@id': iri('pages', id),
    '@type': 'Page',
    portfolio: iri('portfolios', portfolio),
    intitule,
    description,
    traces: traces.map((trace) => iri('traces', trace)),
    dateSuppression: null,
  }
}

export const PAGES: readonly Page[] = [
  page(
    1,
    1,
    'Refonte du site du BDE',
    'Projet tutoré de cinq semaines, en équipe de quatre : le site, puis la réservation des salles.',
    [1, 5],
  ),
  page(
    2,
    1,
    'Festival Court Toujours',
    'Identité visuelle et communication d’un festival de courts-métrages.',
    [2],
  ),
  page(
    6,
    1,
    'Étude UX de l’appli Fil Bleu',
    'Étude des usagers du réseau de bus, menée en binôme.',
    [3],
  ),
  page(3, 2, 'Site vitrine d’un artisan', 'Premier site web, réalisé en HTML et CSS.', []),
]

export const PORTFOLIOS: readonly Portfolio[] = [
  {
    '@id': iri('portfolios', 1),
    '@type': 'Portfolio',
    etudiant: iri('etudiants', 1),
    annee: iri('annees', 2),
    intitule: 'Léa Martin, développeuse web',
    description:
      'Étudiante en deuxième année de BUT MMI, parcours Développement web. Je conçois des sites accessibles, de l’étude des utilisateurs jusqu’à la mise en ligne.',
    banniere: null,
    visibilite: 'publique',
    visibleRecruteurs: false,
    pages: [iri('pages', 1), iri('pages', 2), iri('pages', 6)],
    dateCreation: '2026-09-01',
    dateModification: '2026-10-30',
    dateSuppression: null,
  },
  {
    '@id': iri('portfolios', 2),
    '@type': 'Portfolio',
    etudiant: iri('etudiants', 1),
    annee: iri('annees', 1),
    intitule: 'Portfolio de première année',
    description: 'Mes projets de première année de BUT MMI.',
    banniere: null,
    visibilite: 'privee',
    visibleRecruteurs: false,
    pages: [iri('pages', 3)],
    dateCreation: '2025-09-01',
    dateModification: '2026-06-12',
    dateSuppression: null,
  },
]
