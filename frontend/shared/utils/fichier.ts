// Règles des fichiers de trace, communes au formulaire et au serveur.
import type { FileKind } from '../types/fichier'

const MO = 1024 * 1024

/** Formats acceptés et taille maximale par type de trace. Le SVG est exclu (il peut contenir du script). */
export const FILE_RULES = {
  image: {
    kinds: ['jpeg', 'png', 'webp', 'gif'] as readonly FileKind[],
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    maxBytes: 2 * MO,
    wrongKind: 'Choisissez une image JPEG, PNG, WebP ou GIF.',
  },
  pdf: {
    kinds: ['pdf'] as readonly FileKind[],
    accept: 'application/pdf',
    maxBytes: 10 * MO,
    wrongKind: 'Choisissez un fichier PDF.',
  },
} as const

export type FileTraceType = keyof typeof FILE_RULES

export const MIME_TYPES: Record<FileKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
}

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value)
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0))

/** Format réel du fichier, d'après ses premiers octets (« nombre magique »), ou `null`. */
export function detectFileKind(bytes: Uint8Array): FileKind | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(bytes, ascii('GIF87a')) || startsWith(bytes, ascii('GIF89a'))) return 'gif'
  if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8)) return 'webp'
  if (startsWith(bytes, ascii('%PDF-'))) return 'pdf'
  return null
}

/** Message d'erreur en français, ou `null` si le fichier convient au type de trace. */
export function checkFile(
  type: FileTraceType,
  file: { size: number; kind: FileKind | null },
): string | null {
  const rules = FILE_RULES[type]
  if (file.size === 0) return 'Le fichier est vide.'
  if (!file.kind || !rules.kinds.includes(file.kind)) return rules.wrongKind
  if (file.size > rules.maxBytes) {
    return `Le fichier dépasse la taille maximale (${formatSize(rules.maxBytes)}).`
  }
  return null
}

/** Taille lisible en français : « 512 o », « 1,5 Ko », « 2 Mo ». */
export function formatSize(bytes: number): string {
  const format = (value: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
  if (bytes < 1024) return `${bytes} o`
  if (bytes < MO) return `${format(bytes / 1024)} Ko`
  return `${format(bytes / MO)} Mo`
}
