// Filtres de la liste des étudiants (P-ET-01 à P-ET-03) et leur écriture dans l'URL. Module pur
// (sans dépendance Nuxt) : testable dans le projet `unit`.
import {
  ALL,
  criteriaDiff,
  normalize,
  queryChoice,
  queryFlag,
  queryText,
  type RawQuery,
} from './filters'

/** Critères de la liste ; leurs noms sont aussi les paramètres d'URL. */
export interface EtudiantCriteria {
  recherche: string
  groupe: string
  annee: string
  parcours: string
  /** Seulement les étudiants ayant des travaux en attente. */
  enAttente: boolean
}

export const DEFAULT_ETUDIANT_CRITERIA: Readonly<EtudiantCriteria> = {
  recherche: '',
  groupe: ALL,
  annee: ALL,
  parcours: ALL,
  enAttente: false,
}

export interface EtudiantFilterOptions {
  groupes: readonly string[]
  annees: readonly string[]
  parcours: readonly string[]
}

export function etudiantCriteriaFromQuery(
  query: RawQuery,
  options: EtudiantFilterOptions,
): EtudiantCriteria {
  return {
    recherche: queryText(query, 'recherche') ?? DEFAULT_ETUDIANT_CRITERIA.recherche,
    groupe: queryChoice(query, 'groupe', options.groupes, ALL),
    annee: queryChoice(query, 'annee', options.annees, ALL),
    parcours: queryChoice(query, 'parcours', options.parcours, ALL),
    enAttente: queryFlag(query, 'enAttente'),
  }
}

export function etudiantCriteriaToQuery(criteria: EtudiantCriteria): Record<string, string> {
  return criteriaDiff(criteria, { ...DEFAULT_ETUDIANT_CRITERIA })
}

export interface FilterableEtudiant {
  prenom: string
  nom: string
  groupe: string
  annee: string
  parcours: string
}

/** Étudiants qui répondent à tous les critères, triés par nom. */
export function filterEtudiants<T extends FilterableEtudiant>(
  etudiants: readonly T[],
  criteria: EtudiantCriteria,
  pendingTracesOf: (etudiant: T) => number,
): T[] {
  const search = normalize(criteria.recherche)
  return etudiants
    .filter(
      (e) =>
        (criteria.groupe === ALL || e.groupe === criteria.groupe) &&
        (criteria.annee === ALL || e.annee === criteria.annee) &&
        (criteria.parcours === ALL || e.parcours === criteria.parcours) &&
        (!criteria.enAttente || pendingTracesOf(e) > 0) &&
        (!search || normalize(`${e.prenom} ${e.nom}`).includes(search)),
    )
    .sort((a, b) => a.nom.localeCompare(b.nom))
}
