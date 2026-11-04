// Recherche et filtres de la liste « Mes traces » (E-DB-06, E-DB-07) et leur écriture dans l'URL.
// Module pur (sans dépendance Nuxt) : testable dans le projet `unit`.
import type { Validation } from '../../shared/types/evaluation'
import type { Competence, Referentiel } from '../../shared/types/referentiel'
import type { Trace, TraceStatut } from '../../shared/types/trace'
import { idFromIri } from '../../shared/utils/iri'
import { ALL, criteriaDiff, normalize, queryChoice, queryText, type RawQuery } from './filters'

/** Critères de la liste ; leurs noms sont aussi les paramètres d'URL. */
export interface BibliothequeCriteria {
  recherche: string
  statut: TraceStatut | typeof ALL
  /** Identifiant de la compétence, ou « tous ». */
  competence: string
}

export const DEFAULT_BIBLIOTHEQUE_CRITERIA: Readonly<BibliothequeCriteria> = {
  recherche: '',
  statut: ALL,
  competence: ALL,
}

const STATUTS = ['brouillon', 'finalisee', ALL] as const

/** La compétence reste libre ici : le référentiel, chargé plus tard, la contrôle (`withKnownCompetence`). */
export function bibliothequeCriteriaFromQuery(query: RawQuery): BibliothequeCriteria {
  return {
    recherche: queryText(query, 'recherche') ?? DEFAULT_BIBLIOTHEQUE_CRITERIA.recherche,
    statut: queryChoice(query, 'statut', STATUTS, ALL),
    competence: queryText(query, 'competence') ?? ALL,
  }
}

export function bibliothequeCriteriaToQuery(
  criteria: BibliothequeCriteria,
): Record<string, string> {
  return criteriaDiff(
    { ...criteria, recherche: criteria.recherche.trim() },
    { ...DEFAULT_BIBLIOTHEQUE_CRITERIA },
  )
}

/** Une compétence absente du référentiel (lien ancien ou modifié à la main) compte comme « toutes ». */
export function withKnownCompetence(
  criteria: BibliothequeCriteria,
  competences: readonly Competence[],
): BibliothequeCriteria {
  const known = competences.some((c) => idFromIri(c['@id']) === criteria.competence)
  return known ? criteria : { ...criteria, competence: ALL }
}

export interface TraceWithCompetences {
  trace: Trace
  /** Compétences associées à la trace, dans l'ordre du référentiel. */
  competences: Competence[]
}

const lastTouched = (trace: Trace) => trace.dateModification ?? trace.dateCreation

/** Traces de la plus récemment touchée à la plus ancienne, avec leurs compétences. */
export function tracesWithCompetences(
  traces: readonly Trace[],
  validations: readonly Validation[],
  referentiel: Referentiel | null,
): TraceWithCompetences[] {
  const allCompetences = referentiel?.competences ?? []
  return [...traces]
    .sort((a, b) => lastTouched(b).localeCompare(lastTouched(a)))
    .map((trace) => {
      const niveaux = new Set(
        validations.filter((v) => v.trace === trace['@id']).map((v) => v.niveau),
      )
      return {
        trace,
        competences: allCompetences.filter((c) => c.niveaux.some((n) => niveaux.has(n['@id']))),
      }
    })
}

function searchableText({ trace, competences }: TraceWithCompetences): string {
  return normalize(
    [
      trace.titre,
      trace.description,
      trace.contexte,
      ...competences.flatMap((c) => [c.nomCourt, c.libelle]),
    ]
      .filter(Boolean)
      .join(' '),
  )
}

/** Traces qui répondent à tous les critères, dans l'ordre reçu. */
export function filterBibliotheque(
  items: readonly TraceWithCompetences[],
  criteria: BibliothequeCriteria,
): TraceWithCompetences[] {
  const search = normalize(criteria.recherche)
  return items.filter(
    (item) =>
      (criteria.statut === ALL || item.trace.statut === criteria.statut) &&
      (criteria.competence === ALL ||
        item.competences.some((c) => idFromIri(c['@id']) === criteria.competence)) &&
      (!search || searchableText(item).includes(search)),
  )
}
