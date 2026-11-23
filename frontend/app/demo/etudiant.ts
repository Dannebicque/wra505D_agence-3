/**
 * Données de DÉMONSTRATION des maquettes de l'espace étudiant (compétences, retours, CV, corbeille).
 *
 * Provisoire, comme `base.ts` : ces pages passeront par leurs stores et `app/services/` quand elles
 * seront branchées. Les types sont des modèles d'affichage, pas des types du domaine.
 */
import type { ValidationEtat } from '../../shared/types/evaluation'
import {
  COMPETENCES,
  ETATS,
  ETUDIANT_COURANT_ID,
  RETOURS,
  TRACES,
  type DemoCompetence,
  type DemoRetour,
  type DemoTrace,
} from './base'

// ---------------------------------------------------------------------------------------------
// Compétences (E-CP-01, E-CP-03, E-CP-04, E-CP-07)
// ---------------------------------------------------------------------------------------------

export type CompetenceStatut = 'acquis' | 'en-cours' | 'non-acquis' | 'non-evaluee'

/**
 * Libellé, couleur et icône de chaque statut : la couleur n'est jamais la seule information.
 * Les icônes sont celles des états d'évaluation (`ETATS`) ; « non évaluée » a la sienne
 * (cercle en pointillés), distincte de « en attente » et de « en cours ».
 */
export const COMPETENCE_STATUTS: Record<
  CompetenceStatut,
  {
    label: string
    /** Libellé d'un décompte (« 3 acquises »). */
    labelPluriel: string
    color: 'success' | 'warning' | 'error' | 'neutral'
    icon: string
  }
> = {
  acquis: {
    label: 'Acquise',
    labelPluriel: 'Acquises',
    color: 'success',
    icon: ETATS[3].icon,
  },
  'en-cours': {
    label: 'En cours d’acquisition',
    labelPluriel: 'En cours d’acquisition',
    color: 'warning',
    icon: ETATS[2].icon,
  },
  'non-acquis': {
    label: 'Non acquise',
    labelPluriel: 'Non acquises',
    color: 'error',
    icon: ETATS[1].icon,
  },
  'non-evaluee': {
    label: 'Non évaluée',
    labelPluriel: 'Non évaluées',
    color: 'neutral',
    icon: 'i-lucide-circle-dashed',
  },
}

export interface CompetenceTrace {
  trace: DemoTrace
  etat: ValidationEtat
}

export interface CompetenceSuivi {
  competence: DemoCompetence
  /** Toutes les traces de l'étudiant qui visent la compétence, brouillons compris. */
  traces: CompetenceTrace[]
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
  total: number
  statut: CompetenceStatut
}

/**
 * Statut d'une compétence d'après les évaluations de ses traces finalisées : la meilleure
 * évaluation obtenue l'emporte (une trace acquise suffit). Règle de maquette, à confirmer avec le
 * client (voir le point ouvert n° 11 de docs/FONCTIONNALITES.md : évaluations ou niveaux).
 */
export function competenceStatut(etats: readonly ValidationEtat[]): CompetenceStatut {
  if (etats.includes(3)) return 'acquis'
  if (etats.includes(2)) return 'en-cours'
  if (etats.includes(1)) return 'non-acquis'
  return 'non-evaluee'
}

export function competenceSuivi(
  competence: DemoCompetence,
  traces: readonly DemoTrace[] = TRACES.filter((t) => t.etudiantId === ETUDIANT_COURANT_ID),
): CompetenceSuivi {
  const visees: CompetenceTrace[] = traces.flatMap((trace) =>
    trace.competences
      .filter((c) => c.competenceId === competence.id)
      .map((c) => ({ trace, etat: c.etat })),
  )
  // Un brouillon n'est pas encore soumis à l'évaluation : il ne compte pas dans la progression
  const etats = visees.filter((v) => v.trace.statut === 'finalisee').map((v) => v.etat)
  const count = (etat: ValidationEtat) => etats.filter((e) => e === etat).length

  return {
    competence,
    traces: visees,
    acquired: count(3),
    inProgress: count(2),
    notAcquired: count(1),
    pending: count(0),
    total: etats.length,
    statut: competenceStatut(etats),
  }
}

export const SUIVI_COMPETENCES: CompetenceSuivi[] = COMPETENCES.map((c) => competenceSuivi(c))

// ---------------------------------------------------------------------------------------------
// Retours (E-EV-01 à E-EV-07)
// ---------------------------------------------------------------------------------------------

/** Retours de l’étudiante courante (source unique : `base.ts`, aussi lue par la cloche). */
export const RETOURS_ETUDIANT: DemoRetour[] = RETOURS

// ---------------------------------------------------------------------------------------------
// CV (E-CV-01, E-CV-05, E-CV-06)
// ---------------------------------------------------------------------------------------------

export type CvVariante = 'stage' | 'alternance'

export const CV_VARIANTES: { label: string; value: CvVariante; description: string }[] = [
  {
    label: 'Candidature de stage',
    value: 'stage',
    description: 'Stage de fin d’année, 8 à 12 semaines',
  },
  {
    label: 'Candidature en alternance',
    value: 'alternance',
    description: 'Contrat d’apprentissage, rythme école-entreprise',
  },
]

/** Niveaux du Cadre européen commun de référence pour les langues. */
export const NIVEAUX_LANGUE = [
  'A1 : débutant',
  'A2 : élémentaire',
  'B1 : intermédiaire',
  'B2 : avancé',
  'C1 : autonome',
  'C2 : maîtrise',
  'Langue maternelle',
] as const

export type NiveauLangue = (typeof NIVEAUX_LANGUE)[number]

export interface CvExperience {
  id: number
  poste: string
  structure: string
  periode: string
  description: string
}

export interface CvFormation {
  id: number
  diplome: string
  etablissement: string
  periode: string
}

export interface CvLangue {
  id: number
  langue: string
  niveau: NiveauLangue
}

export interface DemoCv {
  prenom: string
  nom: string
  titre: string
  email: string
  telephone: string
  ville: string
  /** Une accroche par variante de candidature (E-CV-06). */
  accroches: Record<CvVariante, string>
  experiences: CvExperience[]
  formations: CvFormation[]
  langues: CvLangue[]
  competences: string[]
}

export const CV_DEMO: DemoCv = {
  prenom: 'Léa',
  nom: 'Martin',
  titre: 'Étudiante en BUT MMI, parcours Développement web',
  email: 'lea.martin@etudiant.exemple.fr',
  telephone: '06 12 34 56 78',
  ville: 'Troyes',
  accroches: {
    stage:
      'Étudiante en deuxième année de BUT MMI, je recherche un stage de 10 semaines à partir d’avril 2027 pour contribuer au développement d’interfaces web accessibles.',
    alternance:
      'Je recherche une alternance en développement web pour ma troisième année de BUT MMI (rythme trois semaines en entreprise, une semaine à l’IUT), à partir de septembre 2027.',
  },
  experiences: [
    {
      id: 1,
      poste: 'Développeuse web (projet tutoré)',
      structure: 'Bureau des étudiants de l’IUT',
      periode: 'Septembre à octobre 2026',
      description:
        'Refonte du site du BDE en Nuxt : audit, maquettes, intégration accessible et mise en ligne.',
    },
    {
      id: 2,
      poste: 'Animatrice périscolaire',
      structure: 'Mairie de Troyes',
      periode: 'Été 2025',
      description: 'Encadrement d’ateliers numériques pour des enfants de 8 à 11 ans.',
    },
  ],
  formations: [
    {
      id: 1,
      diplome: 'BUT Métiers du multimédia et de l’internet',
      etablissement: 'IUT de Troyes',
      periode: '2025 à 2028',
    },
    {
      id: 2,
      diplome: 'Baccalauréat général, spécialités NSI et mathématiques',
      etablissement: 'Lycée Camille Claudel, Troyes',
      periode: '2025',
    },
  ],
  langues: [
    { id: 1, langue: 'Français', niveau: 'Langue maternelle' },
    { id: 2, langue: 'Anglais', niveau: 'B2 : avancé' },
  ],
  competences: ['Vue et Nuxt', 'TypeScript', 'Accessibilité numérique', 'Figma', 'Git'],
}

// ---------------------------------------------------------------------------------------------
// Corbeille (C-09)
// ---------------------------------------------------------------------------------------------

/** Durée de conservation avant suppression définitive. À confirmer avec le client. */
export const CORBEILLE_DUREE_JOURS = 30

export type ElementSupprimeType = 'trace' | 'page' | 'portfolio'

export const ELEMENT_SUPPRIME_TYPES: Record<ElementSupprimeType, { label: string; icon: string }> =
  {
    trace: { label: 'Trace', icon: 'i-lucide-file' },
    page: { label: 'Page de portfolio', icon: 'i-lucide-panels-top-left' },
    portfolio: { label: 'Portfolio', icon: 'i-lucide-book-open' },
  }

export interface DemoElementSupprime {
  id: number
  type: ElementSupprimeType
  titre: string
  /** Où se trouvait l'élément (portfolio d'une page, par exemple). */
  origine?: string
  dateSuppression: string
}

export const CORBEILLE: DemoElementSupprime[] = [
  {
    id: 1,
    type: 'trace',
    titre: 'Maquette mobile de l’application Vélocité',
    dateSuppression: '2026-11-01',
  },
  {
    id: 2,
    type: 'page',
    titre: 'Projet de première année : site vitrine',
    origine: 'Léa Martin, développeuse web',
    dateSuppression: '2026-10-24',
  },
  {
    id: 3,
    type: 'portfolio',
    titre: 'Portfolio de candidature (brouillon)',
    dateSuppression: '2026-10-12',
  },
]

/** Date (AAAA-MM-JJ) de suppression définitive d'un élément mis à la corbeille ce jour-là. */
export function dateExpiration(dateSuppression: string, jours = CORBEILLE_DUREE_JOURS): string {
  const date = new Date(`${dateSuppression}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + jours)
  return date.toISOString().slice(0, 10)
}
