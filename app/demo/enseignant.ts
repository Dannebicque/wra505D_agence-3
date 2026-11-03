/**
 * Données de DÉMONSTRATION de l'espace enseignant (maquettes non encore branchées sur les services).
 *
 * Complète `base.ts` sans le modifier : traces supplémentaires (pour que chaque étudiant ait des
 * travaux cohérents avec ses compteurs), détail des traces, portfolios rattachés aux étudiants,
 * échéances provisoires, et fonctions de filtrage utilisées par les pages.
 * Provisoire : quand les pages seront branchées, elles passeront par leurs stores et `app/services/`.
 */
import type { ValidationEtat } from '../../shared/types/evaluation'
import type { ConceptionIa, RealisationIa } from '../../shared/types/trace'
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

/** Traces des autres étudiants : 7 en attente (12 au total avec `base.ts`) et 3 déjà évaluées. */
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
    description: 'Stratégie, calendrier éditorial et budget de communication du festival Lumières.',
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
]

/**
 * Traces visibles par l'enseignant : seules les traces finalisées lui sont soumises
 * (un brouillon n'est pas encore déposé pour évaluation).
 */
export const TRACES_SOUMISES: DemoTrace[] = [...TRACES, ...TRACES_SUPPLEMENTAIRES]
  .filter((t) => t.statut === 'finalisee')
  .sort((a, b) => a.date.localeCompare(b.date))

/** Une trace attend l'évaluation tant qu'une de ses compétences est « en attente ». */
export function estEnAttente(trace: DemoTrace): boolean {
  return trace.competences.some((c) => c.etat === 0)
}

export function traceSoumiseById(id: number): DemoTrace | undefined {
  return TRACES_SOUMISES.find((t) => t.id === id)
}

export function tracesDeEtudiant(etudiantId: number): DemoTrace[] {
  return TRACES_SOUMISES.filter((t) => t.etudiantId === etudiantId)
}

/** Nom complet affiché (« Léa Martin »), ou un repli si l'étudiant n'existe pas. */
export function nomEtudiant(etudiantId: number): string {
  const etudiant = etudiantById(etudiantId)
  return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu'
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

const DETAILS: Record<number, Partial<DemoTraceDetail>> = {
  1: {
    contexte: 'Projet tutoré, semestre 3',
    contenu: 'https://velocite-asso.fr',
    conceptionIa: 'aucun',
    realisationIa: 'peu',
  },
  2: {
    contexte: 'Commande de la ville, semestre 3',
    contenu: 'affiche-festival-lumieres.jpg',
    legende: 'Affiche verticale : une lanterne orange se détache sur un ciel bleu nuit.',
    taille: '2,4 Mo',
    conceptionIa: 'moyen',
    realisationIa: 'aucun',
  },
  3: {
    contexte: 'Ressource « Expérience utilisateur », semestre 3',
    contenu: 'etude-utilisateurs-ent.pdf',
    taille: '3,1 Mo',
    conceptionIa: 'aucun',
    realisationIa: 'aucun',
  },
  5: {
    contexte: 'Journées portes ouvertes',
    contenu: 'https://video.exemple.fr/generique-mmi',
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
  },
  6: { contenu: 'https://salles.exemple.fr', conceptionIa: 'aucun', realisationIa: 'peu' },
  7: { contenu: 'charte-graphique-bde.pdf', taille: '6,8 Mo' },
  8: { contenu: 'https://video.exemple.fr/podcast-metiers-du-web' },
  9: {
    contenu: 'affiche-fete-de-la-science.png',
    legende: 'Affiche : un microscope dessiné au trait, entouré de bulles colorées.',
    taille: '1,9 Mo',
  },
  10: { contenu: 'storyboard-seuil.pdf', taille: '8,2 Mo' },
  11: { contenu: 'https://quiz.exemple.fr', realisationIa: 'moyen' },
  12: { contenu: 'audit-accessibilite-mairie.pdf', taille: '1,2 Mo' },
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
}

/** Commentaire existant d'une trace évaluée : repris des retours de `base.ts` quand il y en a un. */
function evaluationExistante(trace: DemoTrace): DemoTraceDetail['evaluation'] {
  if (trace.competences.every((c) => c.etat === 0)) return null
  const commentaire = RETOURS.find((r) => r.traceId === trace.id && r.type === 'commentaire')
  return {
    enseignant: commentaire?.enseignant ?? 'Mme Dupont',
    date: commentaire?.date ?? trace.date,
    commentaire: commentaire?.contenu ?? '',
  }
}

export function detailTrace(trace: DemoTrace): DemoTraceDetail {
  const detail = DETAILS[trace.id] ?? {}
  return {
    contexte: detail.contexte ?? 'Projet du semestre 3',
    contenu: detail.contenu ?? '',
    legende: detail.legende ?? null,
    taille: detail.taille ?? null,
    conceptionIa: detail.conceptionIa ?? 'non_renseigne',
    realisationIa: detail.realisationIa ?? 'non_renseigne',
    evaluation: evaluationExistante(trace),
  }
}

// ---------------------------------------------------------------------------------------------
// Filtres des traces à évaluer (P-EV-10, P-OR-02)
// ---------------------------------------------------------------------------------------------

/** Valeur « pas de filtre » des listes déroulantes (une option ne peut pas avoir une valeur vide). */
export const TOUS = 'tous'

export type StatutFiltre = 'a-evaluer' | 'evaluees' | typeof TOUS

export interface CriteresTraces {
  recherche: string
  etudiant: string
  groupe: string
  competence: string
  statut: StatutFiltre
}

export const CRITERES_PAR_DEFAUT: CriteresTraces = {
  recherche: '',
  etudiant: TOUS,
  groupe: TOUS,
  competence: TOUS,
  // Par défaut, seulement les traces non évaluées (P-EV-10)
  statut: 'a-evaluer',
}

/** Comparaison sans casse ni accents (« lea » trouve « Léa »). */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function filtrerTraces(criteres: CriteresTraces): DemoTrace[] {
  const recherche = normaliser(criteres.recherche)
  return TRACES_SOUMISES.filter((trace) => {
    const etudiant = etudiantById(trace.etudiantId)
    if (criteres.etudiant !== TOUS && String(trace.etudiantId) !== criteres.etudiant) return false
    if (criteres.groupe !== TOUS && etudiant?.groupe !== criteres.groupe) return false
    if (
      criteres.competence !== TOUS &&
      !trace.competences.some((c) => String(c.competenceId) === criteres.competence)
    )
      return false
    if (criteres.statut === 'a-evaluer' && !estEnAttente(trace)) return false
    if (criteres.statut === 'evaluees' && estEnAttente(trace)) return false
    if (recherche) {
      const texte = normaliser(`${trace.titre} ${nomEtudiant(trace.etudiantId)}`)
      if (!texte.includes(recherche)) return false
    }
    return true
  })
}

/** Lit les critères dans l'URL (liens « Évaluer » et navigation entre traces). */
export function criteresDepuisQuery(query: Record<string, unknown>): CriteresTraces {
  const texte = (cle: keyof CriteresTraces) =>
    typeof query[cle] === 'string' ? (query[cle] as string) : undefined
  const statut = texte('statut')
  return {
    recherche: texte('recherche') ?? CRITERES_PAR_DEFAUT.recherche,
    etudiant: texte('etudiant') ?? TOUS,
    groupe: texte('groupe') ?? TOUS,
    competence: texte('competence') ?? TOUS,
    statut:
      statut === 'evaluees' || statut === TOUS || statut === 'a-evaluer'
        ? statut
        : CRITERES_PAR_DEFAUT.statut,
  }
}

/** Critères à placer dans l'URL : seuls ceux qui diffèrent des valeurs par défaut. */
export function criteresVersQuery(criteres: CriteresTraces): Record<string, string> {
  const query: Record<string, string> = {}
  for (const cle of Object.keys(criteres) as (keyof CriteresTraces)[]) {
    if (criteres[cle] !== CRITERES_PAR_DEFAUT[cle]) query[cle] = criteres[cle]
  }
  return query
}

// ---------------------------------------------------------------------------------------------
// Étudiants, groupes, progression
// ---------------------------------------------------------------------------------------------

const unique = (valeurs: string[]) => [...new Set(valeurs)].sort((a, b) => a.localeCompare(b))

export const GROUPES = unique(ETUDIANTS.map((e) => e.groupe))
export const ANNEES = unique(ETUDIANTS.map((e) => e.annee))
export const PARCOURS = unique(ETUDIANTS.map((e) => e.parcours))

export interface RepartitionCompetence {
  competenceId: number
  nomCourt: string
  acquis: number
  enCours: number
  nonAcquis: number
  enAttente: number
  total: number
}

/** Répartition des évaluations par compétence, sur un ensemble de traces. */
export function repartitionParCompetence(traces: readonly DemoTrace[]): RepartitionCompetence[] {
  return COMPETENCES.map((competence) => {
    const etats: ValidationEtat[] = traces.flatMap((t) =>
      t.competences.filter((c) => c.competenceId === competence.id).map((c) => c.etat),
    )
    const compte = (etat: ValidationEtat) => etats.filter((e) => e === etat).length
    return {
      competenceId: competence.id,
      nomCourt: competence.nomCourt,
      acquis: compte(3),
      enCours: compte(2),
      nonAcquis: compte(1),
      enAttente: compte(0),
      total: etats.length,
    }
  })
}

/** Résumé textuel d'une répartition (la barre colorée n'est jamais la seule information). */
export function resumeRepartition(r: RepartitionCompetence): string {
  if (r.total === 0) return 'aucune trace évaluée'
  const parties = [
    r.acquis && `${r.acquis} acquis`,
    r.enCours && `${r.enCours} en cours`,
    r.nonAcquis && `${r.nonAcquis} non acquis`,
    r.enAttente && `${r.enAttente} en attente`,
  ].filter(Boolean)
  return parties.join(' · ')
}

export function etudiantsFiltres(criteres: {
  recherche: string
  groupe: string
  annee: string
  parcours: string
  enAttenteSeulement: boolean
}): DemoEtudiant[] {
  const recherche = normaliser(criteres.recherche)
  return ETUDIANTS.filter(
    (e) =>
      (criteres.groupe === TOUS || e.groupe === criteres.groupe) &&
      (criteres.annee === TOUS || e.annee === criteres.annee) &&
      (criteres.parcours === TOUS || e.parcours === criteres.parcours) &&
      (!criteres.enAttenteSeulement || e.enAttente > 0) &&
      (!recherche || normaliser(`${e.prenom} ${e.nom}`).includes(recherche)),
  ).sort((a, b) => a.nom.localeCompare(b.nom))
}

// ---------------------------------------------------------------------------------------------
// Portfolios des étudiants
// ---------------------------------------------------------------------------------------------

export interface DemoPortfolioEtudiant extends DemoPortfolio {
  etudiantId: number
}

export const PORTFOLIOS_ETUDIANTS: DemoPortfolioEtudiant[] = [
  // Les portfolios de `base.ts` sont ceux de Léa Martin
  ...PORTFOLIOS.map((p) => ({ ...p, etudiantId: 1 })),
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
        traceIds: [10, 6],
      },
    ],
  },
]

export function portfoliosDeEtudiant(etudiantId: number): DemoPortfolioEtudiant[] {
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
