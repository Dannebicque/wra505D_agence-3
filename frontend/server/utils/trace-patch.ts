// Règles propres aux routes de modification des traces. Fonctions pures, testables sans h3.
import type { Violation } from '../../shared/types/api'
import type { FileKind } from '../../shared/types/fichier'
import type { Trace, TraceInput } from '../../shared/types/trace'
import { FILE_RULES } from '../../shared/utils/fichier'

/** Champs modifiables : tout autre champ envoyé (IRI, bibliothèque, dates…) est ignoré. */
export const EDITABLE_TRACE_FIELDS: readonly (keyof TraceInput)[] = [
  'titre',
  'description',
  'contexte',
  'legende',
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

/**
 * Une trace image ou PDF référence un fichier déposé par CE visiteur, du format attendu
 * (`ownedFileKind` : format du fichier référencé s'il lui appartient, sinon `null`).
 * Un fichier existant inchangé reste accepté (fichiers de l'ancienne version), un brouillon sans
 * fichier aussi. Sinon n'importe quel chemin, ou le fichier d'un autre visiteur, pourrait y être glissé.
 */
export function fileFieldViolations(
  existing: Trace | null,
  value: Pick<TraceInput, 'type' | 'contenu'>,
  ownedFileKind: FileKind | null,
): Violation[] {
  if (value.type !== 'image' && value.type !== 'pdf') return []
  if (value.contenu.length === 0) return []
  const unchanged =
    existing !== null &&
    existing.type === value.type &&
    JSON.stringify(existing.contenu) === JSON.stringify(value.contenu)
  if (unchanged) return []
  if (ownedFileKind && FILE_RULES[value.type].kinds.includes(ownedFileKind)) return []
  return [
    { propertyPath: 'contenu', message: 'Déposez un fichier du bon format avant de l’associer.' },
  ]
}

/** Identifiant du fichier déposé référencé par le contenu (`/api/fichiers/<id>`), ou `null`. */
export function uploadedFileId(contenu: readonly string[]): string | null {
  const match = /^\/api\/fichiers\/([0-9a-f-]{36})$/.exec(contenu[0] ?? '')
  return match?.[1] ?? null
}
