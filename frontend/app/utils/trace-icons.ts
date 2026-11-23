// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`, d'où l'import relatif.
import type { TraceType } from '../../shared/types/trace'

/** Icône Lucide de chaque type de trace (recherche globale, rendu d'un portfolio…). */
export const TRACE_TYPE_ICONS: Record<TraceType, string> = {
  image: 'i-lucide-image',
  pdf: 'i-lucide-file-text',
  video: 'i-lucide-video',
  lien: 'i-lucide-link',
}
