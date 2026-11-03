/**
 * Données de DÉMONSTRATION des maquettes (pages non encore branchées sur les services).
 *
 * Provisoire : quand une page est rendue fonctionnelle, elle passe par son store et `app/services/`,
 * et cesse d'importer ce dossier. Les types ci-dessous sont des modèles d'affichage propres aux
 * maquettes, pas des types du domaine (ceux-là vivent dans `shared/types/`).
 */
import type { ValidationEtat } from '../../shared/types/evaluation'
import type { PortfolioVisibilite } from '../../shared/types/portfolio'
import type { TraceStatut, TraceType } from '../../shared/types/trace'

export interface DemoCompetence {
  id: number
  nomCourt: string
  libelle: string
  /** Niveau travaillé cette année (1 à 3). */
  niveau: number
  niveauLibelle: string
  apprentissagesCritiques: string[]
}

export interface DemoEtudiant {
  id: number
  prenom: string
  nom: string
  annee: string
  parcours: string
  groupe: string
  /** Traces finalisées qui attendent une évaluation. */
  enAttente: number
  traces: number
  /** Évaluations acquises sur le total. */
  acquises: number
  evaluations: number
}

export interface DemoTrace {
  id: number
  titre: string
  type: TraceType
  statut: TraceStatut
  date: string
  description: string
  etudiantId: number
  /** Compétences visées, avec leur évaluation. */
  competences: { competenceId: number; etat: ValidationEtat }[]
}

export interface DemoPageProjet {
  id: number
  intitule: string
  description: string
  traceIds: number[]
}

export interface DemoPortfolio {
  id: number
  slug: string
  intitule: string
  annee: string
  description: string
  visibilite: PortfolioVisibilite
  publie: boolean
  dateModification: string
  pages: DemoPageProjet[]
}

export interface DemoRetour {
  id: number
  type: 'evaluation' | 'commentaire'
  lu: boolean
  date: string
  enseignant: string
  traceId: number
  /** Commentaire, ou résumé de l'évaluation. */
  contenu: string
}

export const ETATS: Record<
  ValidationEtat,
  { label: string; color: 'neutral' | 'error' | 'warning' | 'success' }
> = {
  0: { label: 'En attente', color: 'neutral' },
  1: { label: 'Non acquis', color: 'error' },
  2: { label: 'En cours d’acquisition', color: 'warning' },
  3: { label: 'Acquis', color: 'success' },
}

export const ENSEIGNANT_COURANT = { prenom: 'Claire', nom: 'Dupont', civilite: 'Mme' }

export const ETUDIANT_COURANT_ID = 1

export const COMPETENCES: DemoCompetence[] = [
  {
    id: 1,
    nomCourt: 'Comprendre',
    libelle:
      'Comprendre les écosystèmes, les besoins des utilisateurs et les dispositifs de communication numérique',
    niveau: 2,
    niveauLibelle: 'Comprendre la stratégie de communication et l’expérience utilisateur',
    apprentissagesCritiques: [
      'Analyser un écosystème numérique et ses acteurs',
      'Conduire une étude utilisateurs (entretiens, personas)',
      'Mesurer l’audience et interpréter des indicateurs',
    ],
  },
  {
    id: 2,
    nomCourt: 'Concevoir',
    libelle:
      'Concevoir ou co-concevoir une réponse stratégique pertinente à une problématique complexe',
    niveau: 2,
    niveauLibelle: 'Co-concevoir une réponse stratégique',
    apprentissagesCritiques: [
      'Formuler un concept à partir d’une problématique',
      'Construire une proposition de valeur',
      'Co-concevoir avec les parties prenantes',
    ],
  },
  {
    id: 3,
    nomCourt: 'Exprimer',
    libelle: 'Exprimer un message avec les médias numériques pour informer et communiquer',
    niveau: 2,
    niveauLibelle: 'Exprimer une identité visuelle et éditoriale trans-média',
    apprentissagesCritiques: [
      'Produire une charte graphique cohérente',
      'Écrire pour le web et les réseaux',
      'Réaliser un contenu audiovisuel',
    ],
  },
  {
    id: 4,
    nomCourt: 'Développer',
    libelle: 'Développer pour le web et les médias numériques',
    niveau: 2,
    niveauLibelle: 'Développer une application Web interactive',
    apprentissagesCritiques: [
      'Développer une interface accessible et responsive',
      'Concevoir une base de données et une API',
      'Versionner et déployer une application',
    ],
  },
  {
    id: 5,
    nomCourt: 'Entreprendre',
    libelle: 'Entreprendre dans le secteur du numérique',
    niveau: 2,
    niveauLibelle: 'Entreprendre un projet au sein d’un écosystème numérique',
    apprentissagesCritiques: [
      'Élaborer un modèle économique',
      'Piloter un projet en équipe',
      'Présenter un projet à des partenaires',
    ],
  },
]

export const ETUDIANTS: DemoEtudiant[] = [
  {
    id: 1,
    prenom: 'Léa',
    nom: 'Martin',
    annee: 'BUT MMI 2',
    parcours: 'Développement web',
    groupe: 'TP A1',
    enAttente: 2,
    traces: 8,
    acquises: 3,
    evaluations: 8,
  },
  {
    id: 2,
    prenom: 'Hugo',
    nom: 'Bernard',
    annee: 'BUT MMI 2',
    parcours: 'Développement web',
    groupe: 'TP A1',
    enAttente: 0,
    traces: 5,
    acquises: 4,
    evaluations: 6,
  },
  {
    id: 3,
    prenom: 'Inès',
    nom: 'Moreau',
    annee: 'BUT MMI 2',
    parcours: 'Création numérique',
    groupe: 'TP A2',
    enAttente: 3,
    traces: 9,
    acquises: 2,
    evaluations: 9,
  },
  {
    id: 4,
    prenom: 'Nathan',
    nom: 'Petit',
    annee: 'BUT MMI 2',
    parcours: 'Création numérique',
    groupe: 'TP A2',
    enAttente: 1,
    traces: 4,
    acquises: 1,
    evaluations: 4,
  },
  {
    id: 5,
    prenom: 'Chloé',
    nom: 'Robert',
    annee: 'BUT MMI 2',
    parcours: 'Stratégie de communication',
    groupe: 'TP B1',
    enAttente: 0,
    traces: 7,
    acquises: 6,
    evaluations: 7,
  },
  {
    id: 6,
    prenom: 'Yanis',
    nom: 'Richard',
    annee: 'BUT MMI 2',
    parcours: 'Développement web',
    groupe: 'TP B1',
    enAttente: 4,
    traces: 6,
    acquises: 0,
    evaluations: 5,
  },
  {
    id: 7,
    prenom: 'Manon',
    nom: 'Durand',
    annee: 'BUT MMI 3',
    parcours: 'Développement web',
    groupe: 'TP A1',
    enAttente: 0,
    traces: 12,
    acquises: 10,
    evaluations: 12,
  },
  {
    id: 8,
    prenom: 'Lucas',
    nom: 'Lefèvre',
    annee: 'BUT MMI 3',
    parcours: 'Création numérique',
    groupe: 'TP A2',
    enAttente: 2,
    traces: 10,
    acquises: 7,
    evaluations: 11,
  },
]

export const TRACES: DemoTrace[] = [
  {
    id: 1,
    titre: 'Refonte du site de l’association Vélocité',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-28',
    description:
      'Refonte complète en Nuxt du site de l’association : audit, maquettes, intégration accessible et mise en ligne.',
    etudiantId: 1,
    competences: [
      { competenceId: 4, etat: 3 },
      { competenceId: 2, etat: 2 },
    ],
  },
  {
    id: 2,
    titre: 'Affiche du festival Lumières',
    type: 'image',
    statut: 'finalisee',
    date: '2026-10-21',
    description: 'Affiche et déclinaisons réseaux sociaux pour le festival de la ville.',
    etudiantId: 1,
    competences: [{ competenceId: 3, etat: 0 }],
  },
  {
    id: 3,
    titre: 'Étude utilisateurs de l’ENT',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-14',
    description:
      'Dix entretiens, trois personas et une carte d’expérience de l’espace numérique de travail.',
    etudiantId: 1,
    competences: [
      { competenceId: 1, etat: 3 },
      { competenceId: 3, etat: 1 },
    ],
  },
  {
    id: 4,
    titre: 'Business model d’une appli de covoiturage',
    type: 'pdf',
    statut: 'brouillon',
    date: '2026-10-30',
    description: 'Canevas du modèle économique et étude de marché pour une application étudiante.',
    etudiantId: 1,
    competences: [{ competenceId: 5, etat: 0 }],
  },
  {
    id: 5,
    titre: 'Motion design du générique MMI',
    type: 'video',
    statut: 'finalisee',
    date: '2026-09-30',
    description: 'Générique animé de quarante secondes pour les journées portes ouvertes.',
    etudiantId: 1,
    competences: [
      { competenceId: 3, etat: 3 },
      { competenceId: 4, etat: 0 },
    ],
  },
  {
    id: 6,
    titre: 'API de réservation de salles',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-25',
    description: 'API REST et interface de réservation des salles de projet, avec tests.',
    etudiantId: 3,
    competences: [{ competenceId: 4, etat: 0 }],
  },
  {
    id: 7,
    titre: 'Charte graphique du BDE',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-19',
    description: 'Logo, typographies, couleurs et gabarits pour le bureau des étudiants.',
    etudiantId: 6,
    competences: [
      { competenceId: 3, etat: 0 },
      { competenceId: 2, etat: 0 },
    ],
  },
  {
    id: 8,
    titre: 'Podcast « Métiers du web »',
    type: 'video',
    statut: 'finalisee',
    date: '2026-10-11',
    description: 'Série de trois épisodes d’entretiens avec des professionnels du web.',
    etudiantId: 4,
    competences: [{ competenceId: 3, etat: 0 }],
  },
]

export const PORTFOLIOS: DemoPortfolio[] = [
  {
    id: 1,
    slug: 'lea-martin-2026',
    intitule: 'Léa Martin, développeuse web',
    annee: '2026-2027',
    description:
      'Étudiante en deuxième année de BUT MMI, parcours Développement web. Je conçois des sites accessibles, de l’étude des utilisateurs jusqu’à la mise en ligne.',
    visibilite: 'publique',
    publie: true,
    dateModification: '2026-10-30',
    pages: [
      {
        id: 1,
        intitule: 'Vélocité, refonte d’un site associatif',
        description: 'Projet tutoré de cinq semaines, en équipe de quatre.',
        traceIds: [1, 3],
      },
      {
        id: 2,
        intitule: 'Festival Lumières',
        description: 'Identité visuelle et communication d’un festival local.',
        traceIds: [2, 5],
      },
    ],
  },
  {
    id: 2,
    slug: 'lea-martin-2025',
    intitule: 'Portfolio de première année',
    annee: '2025-2026',
    description: 'Mes projets de première année de BUT MMI.',
    visibilite: 'privee',
    publie: false,
    dateModification: '2026-06-12',
    pages: [
      {
        id: 3,
        intitule: 'Site vitrine d’un artisan',
        description: 'Premier site web, réalisé en HTML et CSS.',
        traceIds: [],
      },
    ],
  },
]

export const RETOURS: DemoRetour[] = [
  {
    id: 1,
    type: 'evaluation',
    lu: false,
    date: '2026-11-02',
    enseignant: 'Mme Dupont',
    traceId: 1,
    contenu: 'Développer : acquis. Concevoir : en cours d’acquisition.',
  },
  {
    id: 2,
    type: 'commentaire',
    lu: false,
    date: '2026-11-02',
    enseignant: 'Mme Dupont',
    traceId: 1,
    contenu:
      'Très bon travail d’intégration. Pour la conception, montrez davantage comment les retours des membres de l’association ont fait évoluer vos maquettes.',
  },
  {
    id: 3,
    type: 'evaluation',
    lu: true,
    date: '2026-10-20',
    enseignant: 'M. Garnier',
    traceId: 3,
    contenu: 'Comprendre : acquis. Exprimer : non acquis.',
  },
  {
    id: 4,
    type: 'commentaire',
    lu: true,
    date: '2026-10-20',
    enseignant: 'M. Garnier',
    traceId: 3,
    contenu:
      'L’analyse est solide, mais le rendu écrit manque de structure : ajoutez une synthèse.',
  },
]

export function competenceById(id: number): DemoCompetence | undefined {
  return COMPETENCES.find((c) => c.id === id)
}

export function traceById(id: number): DemoTrace | undefined {
  return TRACES.find((t) => t.id === id)
}

export function etudiantById(id: number): DemoEtudiant | undefined {
  return ETUDIANTS.find((e) => e.id === id)
}

/** Date AAAA-MM-JJ en clair (« 28 octobre 2026 »), lue en UTC pour ne pas changer de jour. */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}
