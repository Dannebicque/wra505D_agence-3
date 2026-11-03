/**
 * Données de DÉMONSTRATION de l'espace enseignant (maquettes non encore branchées sur les services).
 *
 * Complète `base.ts` sans le modifier : traces des autres étudiants, détail des traces, portfolios
 * rattachés aux étudiants, échéances provisoires et compteurs. La logique durable (filtres, URL)
 * vit dans `app/utils/trace-filters.ts` et `app/utils/etudiant-filters.ts`.
 * Provisoire : quand les pages seront branchées, elles passeront par leurs stores et `app/services/`.
 *
 * Les compteurs figés de `DemoEtudiant` (`traces`, `acquises`, `evaluations`, `enAttente`) sont
 * IGNORÉS : ils contredisaient les traces. Tous les chiffres sont calculés depuis les traces par
 * `evaluationCounters` / `studentCounters`.
 */
import type { ValidationEtat } from '../../shared/types/evaluation'
import type { ConceptionIa, RealisationIa } from '../../shared/types/trace'
import type { CompetenceProgression } from '../utils/tableau-de-bord'
import {
  filterEtudiants,
  type EtudiantCriteria,
  type EtudiantFilterOptions,
} from '../utils/etudiant-filters'
import {
  filterTraces,
  isTracePending,
  type FilterableAuthor,
  type TraceCriteria,
  type TraceFilterOptions,
} from '../utils/trace-filters'
import {
  COMPETENCES,
  ETUDIANTS,
  PORTFOLIOS,
  RETOURS,
  TRACES,
  etudiantById,
  type DemoEtudiant,
  type DemoPortfolio,
  type DemoTrace,
} from './base'

/**
 * Traces des autres étudiants (celles de Léa, id 1 à 8, et 19 à 21 sont dans `base.ts`) :
 * chaque étudiant a au moins une trace évaluée, la plupart en ont en attente.
 */
const TRACES_SUPPLEMENTAIRES: DemoTrace[] = [
  {
    id: 9,
    titre: 'Affiche de la Fête de la science',
    type: 'image',
    statut: 'finalisee',
    date: '2026-10-29',
    description: 'Affiche A3 et déclinaison pour les écrans du campus.',
    etudiantId: 3,
    competences: [{ competenceId: 3, etat: 0 }],
  },
  {
    id: 10,
    titre: 'Storyboard du court-métrage « Seuil »',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-22',
    description:
      'Storyboard de quarante plans et note d’intention du court-métrage de fin de semestre.',
    etudiantId: 3,
    competences: [
      { competenceId: 3, etat: 0 },
      { competenceId: 2, etat: 0 },
    ],
  },
  {
    id: 11,
    titre: 'Application de quiz en Vue',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-31',
    description: 'Application de quiz multijoueur en Vue 3, avec classement en temps réel.',
    etudiantId: 6,
    competences: [{ competenceId: 4, etat: 0 }],
  },
  {
    id: 12,
    titre: 'Audit d’accessibilité du site de la mairie',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-27',
    description:
      'Audit RGAA de quinze pages, grille de conformité et plan de corrections priorisé.',
    etudiantId: 6,
    competences: [
      { competenceId: 1, etat: 0 },
      { competenceId: 4, etat: 0 },
    ],
  },
  {
    id: 13,
    titre: 'Newsletter du club de basket',
    type: 'image',
    statut: 'finalisee',
    date: '2026-10-16',
    description: 'Gabarit de newsletter mensuelle et premier numéro.',
    etudiantId: 6,
    competences: [{ competenceId: 3, etat: 0 }],
  },
  {
    id: 14,
    titre: 'Identité sonore de la radio étudiante',
    type: 'video',
    statut: 'finalisee',
    date: '2026-10-30',
    description: 'Jingles, virgules sonores et habillage d’antenne de la radio du campus.',
    etudiantId: 8,
    competences: [{ competenceId: 3, etat: 0 }],
  },
  {
    id: 15,
    titre: 'Prototype d’une application de musée',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-24',
    description: 'Prototype interactif d’un parcours de visite, testé avec six visiteurs.',
    etudiantId: 8,
    competences: [
      { competenceId: 2, etat: 0 },
      { competenceId: 1, etat: 0 },
    ],
  },
  {
    id: 16,
    titre: 'Boutique en ligne en Symfony',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-10',
    description: 'Site marchand d’un torréfacteur : catalogue, panier et paiement de test.',
    etudiantId: 2,
    competences: [
      { competenceId: 4, etat: 3 },
      { competenceId: 5, etat: 2 },
    ],
  },
  {
    id: 17,
    titre: 'Plan de communication d’un festival',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-08',
    description:
      'Stratégie, calendrier éditorial et budget de communication du festival Jazz en Seine.',
    etudiantId: 5,
    competences: [
      { competenceId: 1, etat: 3 },
      { competenceId: 2, etat: 3 },
    ],
  },
  {
    id: 18,
    titre: 'Stage : refonte d’un intranet',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-09-26',
    description: 'Refonte de l’intranet d’une PME pendant le stage de deuxième année.',
    etudiantId: 7,
    competences: [
      { competenceId: 4, etat: 3 },
      { competenceId: 5, etat: 3 },
    ],
  },
  {
    id: 22,
    titre: 'Teaser du court-métrage « Seuil »',
    type: 'video',
    statut: 'finalisee',
    date: '2026-10-05',
    description: 'Teaser de trente secondes diffusé sur les réseaux de l’IUT.',
    etudiantId: 3,
    competences: [
      { competenceId: 3, etat: 3 },
      { competenceId: 2, etat: 2 },
    ],
  },
  {
    id: 23,
    titre: 'Identité visuelle d’une brasserie',
    type: 'image',
    statut: 'finalisee',
    date: '2026-10-06',
    description: 'Logo, étiquettes et menu d’une brasserie artisanale.',
    etudiantId: 4,
    competences: [{ competenceId: 3, etat: 2 }],
  },
  {
    id: 24,
    titre: 'API d’un jeu de cartes',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-20',
    description: 'API REST d’un jeu de cartes en ligne, avec authentification et tests.',
    etudiantId: 2,
    competences: [
      { competenceId: 4, etat: 3 },
      { competenceId: 2, etat: 2 },
    ],
  },
  {
    id: 25,
    titre: 'Campagne réseaux sociaux du cinéma',
    type: 'pdf',
    statut: 'finalisee',
    date: '2026-10-14',
    description: 'Calendrier éditorial et visuels d’un mois de campagne pour le cinéma du centre.',
    etudiantId: 5,
    competences: [
      { competenceId: 1, etat: 3 },
      { competenceId: 3, etat: 3 },
    ],
  },
  {
    id: 26,
    titre: 'Application de suivi des stages',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-03',
    description: 'Application de suivi des stages pour le secrétariat du département.',
    etudiantId: 7,
    competences: [
      { competenceId: 4, etat: 3 },
      { competenceId: 2, etat: 3 },
    ],
  },
  {
    id: 27,
    titre: 'Habillage graphique d’une web-série',
    type: 'video',
    statut: 'finalisee',
    date: '2026-10-09',
    description: 'Générique, titrages et transitions d’une web-série de cinq épisodes.',
    etudiantId: 8,
    competences: [
      { competenceId: 3, etat: 3 },
      { competenceId: 2, etat: 1 },
    ],
  },
  {
    id: 28,
    titre: 'Intégration d’une maquette responsive',
    type: 'lien',
    statut: 'finalisee',
    date: '2026-10-02',
    description: 'Intégration HTML et CSS d’une page d’accueil, du mobile au grand écran.',
    etudiantId: 6,
    competences: [{ competenceId: 4, etat: 1 }],
  },
]

/**
 * Traces visibles par l'enseignant : seules les traces finalisées lui sont soumises
 * (un brouillon n'est pas encore déposé pour évaluation). Les plus anciennes d'abord.
 */
export const TRACES_SOUMISES: DemoTrace[] = [...TRACES, ...TRACES_SUPPLEMENTAIRES]
  .filter((t) => t.statut === 'finalisee')
  .sort((a, b) => a.date.localeCompare(b.date))

export function traceSoumiseById(id: number): DemoTrace | undefined {
  return TRACES_SOUMISES.find((t) => t.id === id)
}

export function tracesOfEtudiant(etudiantId: number): DemoTrace[] {
  return TRACES_SOUMISES.filter((t) => t.etudiantId === etudiantId)
}

/** Nom complet affiché (« Léa Martin »), ou un repli si l'étudiant n'existe pas. */
export function etudiantName(etudiantId: number): string {
  const etudiant = etudiantById(etudiantId)
  return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu'
}

// ---------------------------------------------------------------------------------------------
// Compteurs (P-OR-01, P-ET-06, P-ST-03) : une seule définition pour toutes les pages
// ---------------------------------------------------------------------------------------------

export interface EvaluationCounters {
  /** Traces finalisées (les seules soumises à l'enseignant). */
  traces: number
  /** Traces dont au moins une compétence attend l'évaluation. */
  pendingTraces: number
  /** Traces dont toutes les compétences sont évaluées. */
  evaluatedTraces: number
  /**
   * Évaluations saisies (compétences évaluées, quel que soit le niveau) : le dénominateur de
   * « évaluations acquises sur… ». Les compétences encore en attente n'y comptent pas.
   */
  evaluations: number
  acquired: number
}

export function evaluationCounters(traces: readonly DemoTrace[]): EvaluationCounters {
  const etats = traces.flatMap((t) => t.competences.map((c) => c.etat))
  const pendingTraces = traces.filter(isTracePending).length
  return {
    traces: traces.length,
    pendingTraces,
    evaluatedTraces: traces.length - pendingTraces,
    evaluations: etats.filter((e) => e !== 0).length,
    acquired: etats.filter((e) => e === 3).length,
  }
}

export function studentCounters(etudiantId: number): EvaluationCounters {
  return evaluationCounters(tracesOfEtudiant(etudiantId))
}

/** « 3 acquises sur 5 », ou « aucune évaluation » (jamais « 0 acquise sur 0 »). */
export function acquiredSummary(counters: EvaluationCounters): string {
  if (counters.evaluations === 0) return 'aucune évaluation'
  return `${counters.acquired} ${counters.acquired > 1 ? 'acquises' : 'acquise'} sur ${counters.evaluations}`
}

// ---------------------------------------------------------------------------------------------
// Détail d'une trace (pièce jointe, contexte, déclaration de l'IA, évaluation existante)
// ---------------------------------------------------------------------------------------------

export interface DemoTraceDetail {
  contexte: string
  /** Nom de fichier (image, PDF) ou adresse (lien, vidéo). */
  contenu: string
  /** Texte alternatif d'une image. */
  legende: string | null
  /** Taille affichée pour un fichier. */
  taille: string | null
  conceptionIa: ConceptionIa
  realisationIa: RealisationIa
  /** Évaluation déjà saisie (P-EV-07) : auteur, date et commentaire visible par l'étudiant. */
  evaluation: { enseignant: string; date: string; commentaire: string } | null
}

/**
 * Pièces jointes : pour Léa (id 1 à 8), les mêmes contenus et légendes que `server/data/traces.ts`
 * (usage de l'IA « non renseigné », comme côté serveur).
 */
const TRACE_DETAILS: Record<number, Partial<DemoTraceDetail>> = {
  1: { contexte: 'Projet tutoré, semestre 3', contenu: 'https://bde.example' },
  2: {
    contexte: 'Commande du festival, semestre 3',
    contenu: 'affiche-court-toujours.jpg',
    legende: 'Affiche orange et noire du festival Court Toujours, titre en grandes lettres',
    taille: '2,4 Mo',
  },
  3: {
    contexte: 'Ressource « Expérience utilisateur », semestre 3',
    contenu: 'etude-ux-fil-bleu.pdf',
    taille: '3,1 Mo',
  },
  4: { contexte: 'Journées portes ouvertes', contenu: 'https://video.example/generique-jpo' },
  5: { contexte: 'Projet tutoré, semestre 3', contenu: 'https://git.example/reservation-salles' },
  6: { contexte: 'Commande d’un client, semestre 3', contenu: 'charte-grimptours.pdf' },
  9: {
    contenu: 'affiche-fete-de-la-science.png',
    legende: 'Affiche : un microscope dessiné au trait, entouré de bulles colorées.',
    taille: '1,9 Mo',
  },
  10: { contenu: 'storyboard-seuil.pdf', taille: '8,2 Mo' },
  11: { contenu: 'https://quiz.exemple.fr', conceptionIa: 'aucun', realisationIa: 'moyen' },
  12: { contenu: 'audit-accessibilite-mairie.pdf', taille: '1,2 Mo', conceptionIa: 'aucun' },
  13: {
    contenu: 'newsletter-basket.png',
    legende: 'Maquette de newsletter : bandeau orange, photo d’équipe et trois brèves.',
    taille: '980 Ko',
  },
  14: { contenu: 'https://video.exemple.fr/radio-campus' },
  15: { contenu: 'https://prototype.exemple.fr/musee' },
  16: { contenu: 'https://torrefacteur.exemple.fr' },
  17: { contenu: 'plan-communication-festival.pdf', taille: '2,2 Mo' },
  18: { contenu: 'https://intranet.exemple.fr' },
  19: { contenu: 'https://fablab.exemple.fr', conceptionIa: 'moyen', realisationIa: 'peu' },
  20: { contenu: 'charte-graphique-bde.pdf', taille: '6,8 Mo' },
  21: { contenu: 'https://video.exemple.fr/podcast-metiers-du-web' },
  22: { contenu: 'https://video.exemple.fr/teaser-seuil' },
  23: {
    contenu: 'brasserie-etiquettes.png',
    legende: 'Trois étiquettes de bouteille vert sapin, un houblon stylisé au centre.',
    taille: '1,4 Mo',
  },
  24: { contenu: 'https://cartes.exemple.fr' },
  25: { contenu: 'campagne-cinema.pdf', taille: '4,5 Mo' },
  26: { contenu: 'https://stages.exemple.fr' },
  27: { contenu: 'https://video.exemple.fr/web-serie' },
  28: { contenu: 'https://integration.exemple.fr' },
}

/**
 * Évaluation existante d'une trace : auteur et date du retour « évaluation » de `base.ts` quand
 * il y en a un, commentaire repris du retour « commentaire » de la même trace.
 */
function existingEvaluation(trace: DemoTrace): DemoTraceDetail['evaluation'] {
  if (trace.competences.every((c) => c.etat === 0)) return null
  const retours = RETOURS.filter((r) => r.traceId === trace.id)
  const evaluation = retours.find((r) => r.type === 'evaluation')
  const commentaire = retours.find((r) => r.type === 'commentaire')
  return {
    enseignant: evaluation?.enseignant ?? commentaire?.enseignant ?? 'Mme Dupont',
    date: evaluation?.date ?? commentaire?.date ?? trace.date,
    commentaire: commentaire?.contenu ?? '',
  }
}

export function traceDetail(trace: DemoTrace): DemoTraceDetail {
  const detail = TRACE_DETAILS[trace.id] ?? {}
  return {
    contexte: detail.contexte ?? 'Projet du semestre 3',
    contenu: detail.contenu ?? '',
    legende: detail.legende ?? null,
    taille: detail.taille ?? null,
    conceptionIa: detail.conceptionIa ?? 'non_renseigne',
    realisationIa: detail.realisationIa ?? 'non_renseigne',
    evaluation: existingEvaluation(trace),
  }
}

// ---------------------------------------------------------------------------------------------
// Filtres (la logique est dans app/utils/ ; ici, les valeurs connues et la source de démonstration)
// ---------------------------------------------------------------------------------------------

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))

export const GROUPES = unique(ETUDIANTS.map((e) => e.groupe))
export const ANNEES = unique(ETUDIANTS.map((e) => e.annee))
export const PARCOURS = unique(ETUDIANTS.map((e) => e.parcours))

export const TRACE_FILTER_OPTIONS: TraceFilterOptions = {
  etudiants: ETUDIANTS.map((e) => String(e.id)),
  groupes: GROUPES,
  competences: COMPETENCES.map((c) => String(c.id)),
}

export const ETUDIANT_FILTER_OPTIONS: EtudiantFilterOptions = {
  groupes: GROUPES,
  annees: ANNEES,
  parcours: PARCOURS,
}

function authorOf(etudiantId: number): FilterableAuthor | undefined {
  const etudiant = etudiantById(etudiantId)
  return etudiant && { name: etudiantName(etudiantId), groupe: etudiant.groupe }
}

/** Traces soumises qui répondent aux critères (les plus anciennes d'abord). */
export function filterSubmittedTraces(criteria: TraceCriteria): DemoTrace[] {
  return filterTraces(TRACES_SOUMISES, criteria, authorOf)
}

export function filterDemoEtudiants(criteria: EtudiantCriteria): DemoEtudiant[] {
  return filterEtudiants(ETUDIANTS, criteria, (e) => studentCounters(e.id).pendingTraces)
}

// ---------------------------------------------------------------------------------------------
// Progression par compétence
// ---------------------------------------------------------------------------------------------

/** Même découpage que la progression du tableau de bord étudiant, pour une compétence de démo. */
export type CompetenceBreakdown = Omit<CompetenceProgression, 'competence'> & {
  competenceId: number
  nomCourt: string
}

/** Répartition des évaluations par compétence, sur un ensemble de traces (ordre du référentiel). */
export function progressionByCompetence(traces: readonly DemoTrace[]): CompetenceBreakdown[] {
  return COMPETENCES.map((competence) => {
    const etats: ValidationEtat[] = traces.flatMap((t) =>
      t.competences.filter((c) => c.competenceId === competence.id).map((c) => c.etat),
    )
    const count = (etat: ValidationEtat) => etats.filter((e) => e === etat).length
    return {
      competenceId: competence.id,
      nomCourt: competence.nomCourt,
      acquired: count(3),
      inProgress: count(2),
      notAcquired: count(1),
      pending: count(0),
      total: etats.length,
    }
  })
}

// ---------------------------------------------------------------------------------------------
// Portfolios des étudiants
// ---------------------------------------------------------------------------------------------

export const PORTFOLIOS_ETUDIANTS: DemoPortfolio[] = [
  ...PORTFOLIOS,
  {
    id: 3,
    etudiantId: 3,
    slug: 'ines-moreau-2026',
    intitule: 'Inès Moreau, création numérique',
    annee: '2026-2027',
    description: 'Mes projets d’image et de son en deuxième année, parcours Création numérique.',
    visibilite: 'publique',
    publie: true,
    dateModification: '2026-10-29',
    pages: [
      {
        id: 4,
        intitule: 'Fête de la science',
        description: 'Identité visuelle de l’édition 2026 sur le campus.',
        traceIds: [9],
      },
      {
        id: 5,
        intitule: 'Court-métrage « Seuil »',
        description: 'Projet audiovisuel de fin de semestre, en équipe de trois.',
        traceIds: [10, 22],
      },
      {
        id: 7,
        intitule: 'Fablab',
        description: 'Application de réservation des machines, réalisée pour le fablab de l’IUT.',
        traceIds: [19],
      },
    ],
  },
]

export function portfoliosOfEtudiant(etudiantId: number): DemoPortfolio[] {
  return PORTFOLIOS_ETUDIANTS.filter((p) => p.etudiantId === etudiantId)
}

// ---------------------------------------------------------------------------------------------
// Échéances (P-OR-06)
// ---------------------------------------------------------------------------------------------

/*
 * PROVISOIRE (point ouvert n° 1 de docs/FONCTIONNALITES.md) : l'origine des échéances n'est pas
 * tranchée (date limite saisie par l'enseignant, calendrier fixe, autre). Ces dates ne servent
 * qu'à la maquette et ne présument pas du modèle retenu.
 */
export const ECHEANCES_PROVISOIRES: {
  id: number
  libelle: string
  date: string
  public: string
}[] = [
  {
    id: 1,
    libelle: 'Dépôt des traces du projet tutoré',
    date: '2026-11-14',
    public: 'BUT MMI 2',
  },
  { id: 2, libelle: 'Jury de mi-parcours', date: '2026-11-27', public: 'BUT MMI 2' },
  { id: 3, libelle: 'Portfolio de stage', date: '2026-12-11', public: 'BUT MMI 3' },
]
