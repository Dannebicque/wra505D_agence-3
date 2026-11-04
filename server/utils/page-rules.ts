// Règles propres aux routes de modification des pages-projets. Fonctions pures, testables sans h3.
import type { Iri, Violation } from '../../shared/types/api'
import type { Page, PageInfo } from '../../shared/types/portfolio'
import type { Trace } from '../../shared/types/trace'

export type IriListCheck = { ok: true; value: Iri[] } | { ok: false; violations: Violation[] }

const refuse = (propertyPath: string, message: string): IriListCheck => ({
  ok: false,
  violations: [{ propertyPath, message }],
})

export const isIri = (value: unknown): value is Iri =>
  typeof value === 'string' && value.startsWith('/api/')

const isIriList = (value: unknown): value is Iri[] => Array.isArray(value) && value.every(isIri)

/** Le nouvel ordre doit contenir exactement les pages actuelles du portfolio. */
export function checkPageOrder(current: readonly Iri[], next: unknown): IriListCheck {
  const isPermutation =
    isIriList(next) &&
    next.length === current.length &&
    new Set(next).size === next.length &&
    next.every((page) => current.includes(page))
  if (!isPermutation) {
    return refuse('pages', 'L’ordre doit reprendre exactement les pages du portfolio.')
  }
  return { ok: true, value: next }
}

export interface PageTracesContext {
  /** Traces déjà dans la page : conservées même si l'étudiant les a modifiées depuis. */
  existing: readonly Iri[]
  /** Traces de l'étudiant. */
  available: readonly Trace[]
  /** Autres pages du même portfolio. */
  otherPages: readonly Page[]
}

/**
 * Une trace ajoutée doit appartenir à l'étudiant et être finalisée. Elle n'apparaît qu'une fois
 * par portfolio : réutiliser une trace dans plusieurs pages (E-TR-06) a été retiré du périmètre.
 */
export function checkPageTraces(next: unknown, context: PageTracesContext): IriListCheck {
  if (!isIriList(next)) return refuse('traces', 'Liste de traces invalide.')
  if (new Set(next).size !== next.length) {
    return refuse('traces', 'Une trace ne peut figurer qu’une fois dans la page.')
  }

  for (const iri of next.filter((item) => !context.existing.includes(item))) {
    const trace = context.available.find((t) => t['@id'] === iri)
    if (!trace || trace.dateSuppression !== null) return refuse('traces', 'Trace introuvable.')
    if (trace.statut !== 'finalisee') {
      return refuse('traces', 'Seule une trace finalisée peut être ajoutée à une page.')
    }
    if (context.otherPages.some((page) => page.traces.includes(iri))) {
      return refuse('traces', `« ${trace.titre} » est déjà dans une autre page de ce portfolio.`)
    }
  }
  return { ok: true, value: next }
}

/** Fusion à la manière d'un PATCH « merge-patch » : seuls l'intitulé et la description changent ici. */
export function mergePagePatch(existing: PageInfo, body: object): Record<string, unknown> {
  const raw = body as Record<string, unknown>
  return {
    intitule: Object.hasOwn(raw, 'intitule') ? raw.intitule : existing.intitule,
    description: Object.hasOwn(raw, 'description') ? raw.description : existing.description,
  }
}
