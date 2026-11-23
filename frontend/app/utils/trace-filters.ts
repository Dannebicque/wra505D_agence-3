// Filtres des traces à évaluer (P-EV-10, P-OR-02) et leur écriture dans l'URL. Module pur (sans
// dépendance Nuxt) : testable dans le projet `unit`, réutilisable quand la liste sera branchée.
import type { ValidationEtat } from '../../shared/types/evaluation'
import { ALL, criteriaDiff, normalize, queryChoice, queryText, type RawQuery } from './filters'

export type StatutFilter = 'a-evaluer' | 'evaluees' | typeof ALL

const STATUT_FILTERS: readonly StatutFilter[] = ['a-evaluer', 'evaluees', ALL]

/** Critères de la liste ; leurs noms sont aussi les paramètres d'URL (en français, lisibles). */
export interface TraceCriteria {
  recherche: string
  etudiant: string
  groupe: string
  competence: string
  statut: StatutFilter
}

export const DEFAULT_CRITERIA: Readonly<TraceCriteria> = {
  recherche: '',
  etudiant: ALL,
  groupe: ALL,
  competence: ALL,
  // Par défaut, seulement les traces non évaluées (P-EV-10)
  statut: 'a-evaluer',
}

/** Valeurs connues des listes déroulantes : une valeur inconnue dans l'URL retombe sur « tous ». */
export interface TraceFilterOptions {
  etudiants: readonly string[]
  groupes: readonly string[]
  competences: readonly string[]
}

/** Lit les critères dans l'URL (liens « Évaluer », retour arrière, navigation entre traces). */
export function criteriaFromQuery(query: RawQuery, options: TraceFilterOptions): TraceCriteria {
  return {
    recherche: queryText(query, 'recherche') ?? DEFAULT_CRITERIA.recherche,
    etudiant: queryChoice(query, 'etudiant', options.etudiants, ALL),
    groupe: queryChoice(query, 'groupe', options.groupes, ALL),
    competence: queryChoice(query, 'competence', options.competences, ALL),
    statut: queryChoice(query, 'statut', STATUT_FILTERS, DEFAULT_CRITERIA.statut),
  }
}

/** Critères à placer dans l'URL : seuls ceux qui diffèrent des valeurs par défaut. */
export function criteriaToQuery(criteria: TraceCriteria): Record<string, string> {
  return criteriaDiff(criteria, { ...DEFAULT_CRITERIA })
}

/** Ce que le filtre doit connaître d'une trace. */
export interface FilterableTrace {
  titre: string
  etudiantId: number
  competences: readonly { competenceId: number; etat: ValidationEtat }[]
}

/** Ce que le filtre doit connaître de l'auteur d'une trace. */
export interface FilterableAuthor {
  name: string
  groupe: string
}

/** Une trace attend l'évaluation tant qu'une de ses compétences est « en attente ». */
export function isTracePending(trace: Pick<FilterableTrace, 'competences'>): boolean {
  return trace.competences.some((c) => c.etat === 0)
}

/**
 * Traces qui répondent à tous les critères. « Évaluées » ne garde que les traces dont toutes les
 * compétences sont évaluées : une trace partiellement évaluée reste « à évaluer ».
 */
export function filterTraces<T extends FilterableTrace>(
  traces: readonly T[],
  criteria: TraceCriteria,
  authorOf: (etudiantId: number) => FilterableAuthor | undefined,
): T[] {
  const search = normalize(criteria.recherche)
  return traces.filter((trace) => {
    const author = authorOf(trace.etudiantId)
    if (criteria.etudiant !== ALL && String(trace.etudiantId) !== criteria.etudiant) return false
    if (criteria.groupe !== ALL && author?.groupe !== criteria.groupe) return false
    if (
      criteria.competence !== ALL &&
      !trace.competences.some((c) => String(c.competenceId) === criteria.competence)
    )
      return false
    if (criteria.statut === 'a-evaluer' && !isTracePending(trace)) return false
    if (criteria.statut === 'evaluees' && isTracePending(trace)) return false
    return !search || normalize(`${trace.titre} ${author?.name ?? ''}`).includes(search)
  })
}
