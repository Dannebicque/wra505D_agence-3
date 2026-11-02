// Règles de validation d'une trace, communes au formulaire et aux routes du serveur.
import type { Violation } from '../types/api'
import type {
  ConceptionIa,
  RealisationIa,
  TraceInput,
  TraceStatut,
  TraceType,
} from '../types/trace'
import { TRACE_TYPES } from './domaine'

export const TRACE_LIMITS = { titre: 100, contexte: 255, description: 5000, adresse: 2048 } as const

const STATUTS: readonly TraceStatut[] = ['brouillon', 'finalisee']
const CONCEPTION_IA: readonly ConceptionIa[] = ['non_renseigne', 'aucun', 'moyen', 'avance']
const REALISATION_IA: readonly RealisationIa[] = [
  'non_renseigne',
  'aucun',
  'peu',
  'moyen',
  'avance',
]
const URL_TYPES: readonly TraceType[] = ['lien', 'video']

export type TraceValidation =
  { ok: true; value: TraceInput } | { ok: false; violations: Violation[] }

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Date AAAA-MM-JJ qui existe vraiment (le 30 février est refusé). */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

/**
 * Valide et normalise une trace saisie. `today` (AAAA-MM-JJ) est passé en paramètre pour que
 * le serveur et les tests décident du « jour » (pas de date de réalisation dans le futur).
 */
export function validateTrace(input: unknown, { today }: { today: string }): TraceValidation {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, violations: [{ propertyPath: '', message: 'Trace invalide.' }] }
  }
  const raw = input as Record<string, unknown>
  const violations: Violation[] = []
  const fail = (propertyPath: string, message: string) => violations.push({ propertyPath, message })

  const titre = typeof raw.titre === 'string' ? raw.titre.trim() : ''
  if (titre === '') fail('titre', 'Le titre est obligatoire.')
  else if (titre.length > TRACE_LIMITS.titre)
    fail('titre', 'Le titre ne doit pas dépasser 100 caractères.')

  const description = optionalText(raw.description)
  if (description && description.length > TRACE_LIMITS.description) {
    fail('description', 'La description ne doit pas dépasser 5 000 caractères.')
  }

  const contexte = optionalText(raw.contexte)
  if (contexte && contexte.length > TRACE_LIMITS.contexte) {
    fail('contexte', 'Le contexte ne doit pas dépasser 255 caractères.')
  }

  const type = raw.type as TraceType
  if (!TRACE_TYPES.includes(type)) fail('type', 'Choisissez un type de trace.')

  const statut = raw.statut as TraceStatut
  if (!STATUTS.includes(statut)) fail('statut', 'Statut de trace inconnu.')

  const contenu = Array.isArray(raw.contenu)
    ? raw.contenu
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item !== '')
    : []
  if (contenu.length === 0 && statut === 'finalisee') {
    fail('contenu', 'Ajoutez le contenu de la trace avant de la finaliser.')
  } else if (contenu.length > 1) {
    // Plusieurs fichiers ou liens par trace : fonctionnalité E-TR-03 retirée
    fail('contenu', 'Une seule adresse par trace.')
  } else if (contenu.some((item) => item.length > TRACE_LIMITS.adresse)) {
    fail('contenu', 'L’adresse ne doit pas dépasser 2 048 caractères.')
  } else if (URL_TYPES.includes(type) && contenu.some((item) => !isWebUrl(item))) {
    fail('contenu', 'Saisissez une adresse web valide, commençant par https:// ou http://.')
  }

  const conceptionIa = (raw.conceptionIa ?? 'non_renseigne') as ConceptionIa
  if (!CONCEPTION_IA.includes(conceptionIa)) {
    fail('conceptionIa', 'Choisissez une déclaration d’usage de l’IA.')
  }
  const realisationIa = (raw.realisationIa ?? 'non_renseigne') as RealisationIa
  if (!REALISATION_IA.includes(realisationIa)) {
    fail('realisationIa', 'Choisissez une déclaration d’usage de l’IA.')
  }

  const dateRealisation = optionalText(raw.dateRealisation)
  if (dateRealisation && !isValidDate(dateRealisation)) {
    fail('dateRealisation', 'Saisissez une date valide.')
  } else if (dateRealisation && dateRealisation > today) {
    fail('dateRealisation', 'La date de réalisation ne peut pas être dans le futur.')
  }

  if (violations.length) return { ok: false, violations }
  return {
    ok: true,
    value: {
      titre,
      description,
      contexte,
      type,
      contenu,
      statut,
      conceptionIa,
      realisationIa,
      dateRealisation,
    },
  }
}
