// Calculs du tableau de bord étudiant. Module pur (sans dépendance Nuxt) : testable dans le projet `unit`.
import type { Validation, ValidationEtat } from '../../shared/types/evaluation'
import type { Competence, Referentiel } from '../../shared/types/referentiel'
import type { Trace } from '../../shared/types/trace'

export interface Counters {
  /** Traces hors corbeille, brouillons compris. */
  traces: number
  drafts: number
  /** Traces finalisées hors corbeille : les seules soumises à l'évaluation. */
  submitted: number
  /** Validations des traces finalisées (les brouillons ne sont pas encore soumis). */
  validations: number
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
  /** Traces finalisées dont au moins une validation attend l'évaluation. */
  pendingTraces: number
}

export interface CompetenceProgression {
  competence: Competence
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
  total: number
}

const isActive = (trace: Trace) => trace.dateSuppression === null

/** Validations comptées : celles des traces finalisées et hors corbeille. */
function countedValidations(
  traces: readonly Trace[],
  validations: readonly Validation[],
): Validation[] {
  const submitted = new Set(
    traces.filter((t) => isActive(t) && t.statut === 'finalisee').map((t) => t['@id']),
  )
  return validations.filter((v) => submitted.has(v.trace))
}

function countByEtat(validations: readonly Validation[], etat: ValidationEtat): number {
  return validations.filter((v) => v.etat === etat).length
}

export function computeCounters(
  traces: readonly Trace[],
  validations: readonly Validation[],
): Counters {
  const active = traces.filter(isActive)
  const counted = countedValidations(traces, validations)
  return {
    traces: active.length,
    drafts: active.filter((t) => t.statut === 'brouillon').length,
    submitted: active.filter((t) => t.statut === 'finalisee').length,
    validations: counted.length,
    acquired: countByEtat(counted, 3),
    inProgress: countByEtat(counted, 2),
    notAcquired: countByEtat(counted, 1),
    pending: countByEtat(counted, 0),
    pendingTraces: new Set(counted.filter((v) => v.etat === 0).map((v) => v.trace)).size,
  }
}

/** Répartition des validations par compétence, dans l'ordre du référentiel (compétences sans validation comprises). */
export function computeProgression(
  referentiel: Referentiel,
  traces: readonly Trace[],
  validations: readonly Validation[],
): CompetenceProgression[] {
  const counted = countedValidations(traces, validations)
  return referentiel.competences.map((competence) => {
    const niveaux = new Set<string>(competence.niveaux.map((n) => n['@id']))
    const own = counted.filter((v) => niveaux.has(v.niveau))
    return {
      competence,
      acquired: countByEtat(own, 3),
      inProgress: countByEtat(own, 2),
      notAcquired: countByEtat(own, 1),
      pending: countByEtat(own, 0),
      total: own.length,
    }
  })
}

export function draftTraces(traces: readonly Trace[]): Trace[] {
  return traces.filter((t) => isActive(t) && t.statut === 'brouillon')
}

const NOMBRES = ['', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix']

/** Le fait du jour, affiché après « Bonjour <prénom>. » */
export function greetingFact(
  counters: Pick<Counters, 'traces' | 'submitted' | 'validations' | 'pendingTraces'>,
): string {
  if (counters.traces === 0) return 'Déposez votre première trace pour commencer.'
  if (counters.submitted === 0) return 'Terminez un brouillon pour le soumettre à l’évaluation.'
  if (counters.validations === 0) {
    return 'Associez des compétences à vos traces pour les faire évaluer.'
  }
  if (counters.pendingTraces === 0) return 'Toutes vos traces ont été évaluées.'
  if (counters.pendingTraces === 1) return 'Une trace attend son évaluation.'
  const nombre = NOMBRES[counters.pendingTraces] ?? String(counters.pendingTraces)
  return `${nombre} traces attendent leur évaluation.`
}

type ProgressionCounts = Pick<
  CompetenceProgression,
  'acquired' | 'inProgress' | 'notAcquired' | 'pending'
>

export interface ProgressionPart {
  key: keyof ProgressionCounts
  count: number
  label: string
}

/** États présents d'une compétence, dans l'ordre des segments de sa barre de progression. */
export function progressionParts(p: ProgressionCounts): ProgressionPart[] {
  const parts: ProgressionPart[] = [
    { key: 'acquired', count: p.acquired, label: 'acquis' },
    { key: 'inProgress', count: p.inProgress, label: 'en cours' },
    { key: 'notAcquired', count: p.notAcquired, label: 'non acquis' },
    { key: 'pending', count: p.pending, label: 'en attente' },
  ]
  return parts.filter((part) => part.count > 0)
}

/** Résumé en texte d'une compétence (équivalent de sa barre de progression). */
export function progressionSummary(p: ProgressionCounts): string {
  const present = progressionParts(p)
  return present.length
    ? present.map(({ count, label }) => `${count} ${label}`).join(' · ')
    : 'aucune trace associée'
}

/**
 * Taux d'acquisition, en pourcentage arrondi à l'unité : part des évaluations rendues (hors
 * « en attente ») qui sont acquises. `null` sans évaluation rendue (pas de « 0 % » trompeur).
 * L'arrondi ne dit jamais « 0 % » s'il y a un acquis, ni « 100 % » s'il en manque un.
 */
export function acquisitionRate(acquired: number, total: number): number | null {
  if (total <= 0) return null
  const rate = Math.round((acquired / total) * 100)
  if (acquired > 0 && rate === 0) return 1
  if (acquired < total && rate === 100) return 99
  return rate
}
