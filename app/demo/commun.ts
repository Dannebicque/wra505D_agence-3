/**
 * Maquettes des éléments communs aux espaces : index de la recherche globale (C-03) et textes de
 * l'aide contextuelle (C-12).
 *
 * Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`, d'où les imports relatifs.
 * Provisoire, comme `base.ts` : la recherche passera par un service quand l'API existera ; les textes
 * d'aide, une fois relus par le PO, rejoindront `app/utils/`.
 */
import type { TraceType } from '../../shared/types/trace'
import { NAVIGATION, type Espace } from '../utils/navigation'
import { COMPETENCES, ETUDIANT_COURANT_ID, ETUDIANTS, TRACES, etudiantById } from './base'

// ─── Recherche globale ──────────────────────────────────────────────────────────

export interface SearchItem {
  label: string
  description?: string
  icon: string
  to: string
}

export interface SearchGroup {
  id: 'pages' | 'traces' | 'competences' | 'etudiants'
  label: string
  items: SearchItem[]
}

export const TRACE_TYPE_ICONS: Record<TraceType, string> = {
  image: 'i-lucide-image',
  pdf: 'i-lucide-file-text',
  video: 'i-lucide-video',
  lien: 'i-lucide-link',
}

/**
 * Groupes de résultats proposés dans l'espace courant. Les pages viennent de la navigation de
 * l'espace : la recherche suit automatiquement l'ajout d'une page.
 */
export function searchGroups(espace: Espace): SearchGroup[] {
  const pages: SearchGroup = {
    id: 'pages',
    label: 'Pages',
    items: NAVIGATION[espace].map((item) => ({
      label: item.label,
      icon: item.icon ?? 'i-lucide-file',
      to: item.to,
    })),
  }

  if (espace === 'etudiant') {
    return [
      pages,
      {
        id: 'traces',
        label: 'Traces',
        items: TRACES.filter((trace) => trace.etudiantId === ETUDIANT_COURANT_ID).map((trace) => ({
          label: trace.titre,
          description: trace.statut === 'brouillon' ? 'Brouillon' : 'Finalisée',
          icon: TRACE_TYPE_ICONS[trace.type],
          to: `/etudiant/traces/${trace.id}`,
        })),
      },
      {
        id: 'competences',
        label: 'Compétences',
        items: COMPETENCES.map((competence) => ({
          label: competence.nomCourt,
          description: competence.libelle,
          icon: 'i-lucide-target',
          to: '/etudiant/competences',
        })),
      },
    ]
  }

  if (espace === 'enseignant') {
    return [
      pages,
      {
        id: 'etudiants',
        label: 'Étudiants',
        items: ETUDIANTS.map((etudiant) => ({
          label: `${etudiant.prenom} ${etudiant.nom}`,
          description: `${etudiant.annee} · ${etudiant.groupe}`,
          icon: 'i-lucide-user-round',
          to: `/enseignant/etudiants/${etudiant.id}`,
        })),
      },
      {
        // Une trace mène à sa page d'évaluation
        id: 'traces',
        label: 'Traces',
        items: TRACES.filter((trace) => trace.statut === 'finalisee').map((trace) => {
          const auteur = etudiantById(trace.etudiantId)
          return {
            label: trace.titre,
            description: auteur ? `${auteur.prenom} ${auteur.nom}` : undefined,
            icon: TRACE_TYPE_ICONS[trace.type],
            to: `/enseignant/evaluations/${trace.id}`,
          }
        }),
      },
    ]
  }

  return [pages]
}

// ─── Aide contextuelle ──────────────────────────────────────────────────────────

export interface Aide {
  titre: string
  intro: string
  /** Étapes ou conseils, dans l'ordre. */
  etapes: string[]
}

export const AIDE_GENERIQUE: Aide = {
  titre: 'Bien démarrer avec UniFolio',
  intro:
    'UniFolio rassemble les traces de vos apprentissages, les portfolios qui les mettent en valeur et les évaluations de l’équipe enseignante.',
  etapes: [
    'Utilisez le menu pour passer d’une rubrique à l’autre.',
    'La recherche (Ctrl + K, ou ⌘ + K sur Mac) retrouve une page, une trace ou une compétence.',
    'Le bouton « Aide » explique la page affichée, à tout moment.',
  ],
}

/** Aides par préfixe de route. La plus précise (préfixe le plus long) l'emporte. */
export const AIDES: Record<string, Aide> = {
  '/etudiant': {
    titre: 'Votre tableau de bord',
    intro:
      'Le tableau de bord résume votre progression : traces déposées, évaluations reçues et compétences travaillées cette année.',
    etapes: [
      'Les barres montrent, pour chaque compétence, la part acquise, en cours ou en attente.',
      'La rubrique « À faire » signale les brouillons à terminer.',
      'Déposez une trace dès qu’un projet est terminé : l’évaluation est plus rapide.',
    ],
  },
  '/etudiant/traces': {
    titre: 'Déposer une trace',
    intro:
      'Une trace est une preuve de ce que vous avez appris : une image, un PDF, une vidéo ou un lien, accompagné de son contexte.',
    etapes: [
      'Choisissez « Déposer une trace », puis donnez-lui un titre clair.',
      'Ajoutez le contenu (fichier ou lien) et décrivez le contexte de réalisation.',
      'Indiquez si vous avez utilisé l’IA, pour la conception comme pour la réalisation.',
      'Votre saisie est enregistrée automatiquement en brouillon.',
      'Finalisez la trace pour la soumettre à l’évaluation de l’équipe enseignante.',
    ],
  },
  '/etudiant/portfolios': {
    titre: 'Composer un portfolio',
    intro:
      'Un portfolio met en scène vos meilleures traces, organisées en pages, pour un jury, un stage ou un recruteur.',
    etapes: [
      'Créez un portfolio et donnez-lui un intitulé et une courte présentation.',
      'Ajoutez des pages (un projet, une compétence…) et placez-y vos traces.',
      'Réorganisez pages et traces dans l’ordre de lecture souhaité.',
      'Publiez-le pour obtenir un lien à partager ; il reste privé tant qu’il n’est pas publié.',
    ],
  },
  '/etudiant/competences': {
    titre: 'Suivre vos compétences',
    intro:
      'Chaque compétence du référentiel se décline en niveaux et en apprentissages critiques, évalués à partir de vos traces.',
    etapes: [
      'Une évaluation peut être : en attente, non acquis, en cours d’acquisition ou acquis.',
      'Associez vos traces aux compétences qu’elles démontrent pour être évalué.',
    ],
  },
  '/etudiant/retours': {
    titre: 'Lire les retours',
    intro:
      'Les retours regroupent les évaluations et les commentaires de l’équipe enseignante sur vos traces.',
    etapes: [
      'Les retours non lus apparaissent en premier et sont signalés par la cloche.',
      'Ouvrez un retour pour revoir la trace concernée et l’améliorer si besoin.',
    ],
  },
  '/enseignant': {
    titre: 'Votre espace enseignant',
    intro:
      'Retrouvez les traces qui attendent une évaluation et suivez la progression des étudiants de vos groupes.',
    etapes: [
      'Le tableau de bord liste en priorité les traces en attente.',
      'La recherche (Ctrl + K) retrouve directement un étudiant ou une trace.',
    ],
  },
  '/enseignant/evaluations': {
    titre: 'Évaluer une trace',
    intro:
      'Évaluez chaque compétence visée par la trace, puis laissez un commentaire pour guider l’étudiant.',
    etapes: [
      'Ouvrez la trace et consultez son contenu et son contexte.',
      'Pour chaque compétence : non acquis, en cours d’acquisition ou acquis.',
      'Ajoutez un commentaire constructif ; l’étudiant est notifié.',
    ],
  },
  '/enseignant/etudiants': {
    titre: 'Suivre un étudiant',
    intro:
      'La fiche d’un étudiant rassemble ses traces, ses portfolios publiés et l’état de ses compétences.',
    etapes: [
      'Filtrez la liste par groupe ou par parcours.',
      'Le nombre de traces en attente indique les évaluations à faire.',
    ],
  },
  '/admin': {
    titre: 'Administration',
    intro:
      'L’administration gère la structure (départements, diplômes, groupes) et le référentiel, synchronisés depuis l’intranet de l’IUT.',
    etapes: [
      'Les comptes et la structure viennent de l’intranet : corrigez-les à la source.',
      'Vérifiez les rôles des comptes avant le début du semestre.',
    ],
  },
}

/** Aide adaptée au chemin : celle du préfixe le plus précis, sinon l'aide générique. */
export function aideForPath(path: string): Aide {
  const prefix = Object.keys(AIDES)
    .filter((key) => path === key || path.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0]
  return (prefix && AIDES[prefix]) || AIDE_GENERIQUE
}
