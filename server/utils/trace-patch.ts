// Règles propres aux routes de modification des traces. Fonctions pures, testables sans h3.
import type { Violation } from '../../shared/types/api'
import type { Trace, TraceInput } from '../../shared/types/trace'

/** Champs modifiables : tout autre champ envoyé (IRI, bibliothèque, dates…) est ignoré. */
export const EDITABLE_TRACE_FIELDS: readonly (keyof TraceInput)[] = [
  'titre',
  'description',
  'contexte',
  'type',
  'contenu',
  'statut',
  'conceptionIa',
  'realisationIa',
  'dateRealisation',
]

/** Fusion à la manière d'un PATCH « merge-patch » : seuls les champs modifiables envoyés changent. */
export function mergeTracePatch(existing: Trace, body: object): Record<string, unknown> {
  return Object.fromEntries(
    EDITABLE_TRACE_FIELDS.map((key) => [
      key,
      Object.hasOwn(body, key) ? (body as Record<string, unknown>)[key] : existing[key],
    ]),
  )
}

const FILE_TYPES = new Set(['image', 'pdf'])

/**
 * Le téléversement des fichiers arrive au lot C : en attendant, aucun fichier image ou PDF ne peut
 * être créé ni remplacé par l'API (sinon n'importe quel chemin ou adresse pourrait y être glissé).
 */
export function fileFieldViolations(
  existing: Trace | null,
  value: Pick<TraceInput, 'type' | 'contenu'>,
): Violation[] {
  if (!FILE_TYPES.has(value.type)) return []
  const unchanged =
    existing !== null &&
    existing.type === value.type &&
    JSON.stringify(existing.contenu) === JSON.stringify(value.contenu)
  return unchanged
    ? []
    : [{ propertyPath: 'type', message: 'Le dépôt de fichiers image ou PDF arrive prochainement.' }]
}
