import type { JsonLdResource } from './api'

/** Format reconnu d'après les premiers octets du fichier (et non son extension). */
export type FileKind = 'jpeg' | 'png' | 'webp' | 'gif' | 'pdf'

/** Fichier déposé par l'étudiant (image ou PDF d'une trace). */
export interface Fichier extends JsonLdResource {
  '@type': 'Fichier'
  nom: string
  mimeType: string
  /** Taille en octets. */
  taille: number
}
