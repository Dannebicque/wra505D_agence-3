// Règles de validation d'une page-projet, communes au formulaire et aux routes du serveur.
import type { Violation } from '../types/api'
import type { PageInfo } from '../types/portfolio'

export const PAGE_LIMITS = {
  intitule: 100,
  description: 500,
} as const

export type PageValidation = { ok: true; value: PageInfo } | { ok: false; violations: Violation[] }

/** Valide et normalise l'intitulé et la description d'une page. */
export function validatePage(input: unknown): PageValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, violations: [{ propertyPath: '', message: 'Page invalide.' }] }
  }
  const raw = input as Record<string, unknown>
  const violations: Violation[] = []

  const intitule = typeof raw.intitule === 'string' ? raw.intitule.trim() : ''
  if (intitule === '') {
    violations.push({ propertyPath: 'intitule', message: 'L’intitulé est obligatoire.' })
  } else if (intitule.length > PAGE_LIMITS.intitule) {
    violations.push({
      propertyPath: 'intitule',
      message: `L’intitulé ne doit pas dépasser ${PAGE_LIMITS.intitule} caractères.`,
    })
  }

  const description =
    typeof raw.description === 'string' && raw.description.trim() !== ''
      ? raw.description.trim()
      : null
  if (description && description.length > PAGE_LIMITS.description) {
    violations.push({
      propertyPath: 'description',
      message: `La description ne doit pas dépasser ${PAGE_LIMITS.description} caractères.`,
    })
  }

  if (violations.length) return { ok: false, violations }
  return { ok: true, value: { intitule, description } }
}
