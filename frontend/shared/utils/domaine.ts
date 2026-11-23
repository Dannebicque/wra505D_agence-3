import type { ValidationEtat } from '../types/evaluation'
import type { ConceptionIa, RealisationIa, TraceType } from '../types/trace'

export const TRACE_TYPES: readonly TraceType[] = ['image', 'pdf', 'video', 'lien']

export const VALIDATION_ETATS: readonly ValidationEtat[] = [0, 1, 2, 3]

// Les `Record` imposent un libellé pour chaque valeur : TypeScript signale tout oubli.

export const TRACE_TYPE_LIBELLES: Record<TraceType, string> = {
  image: 'Image',
  pdf: 'PDF',
  video: 'Vidéo',
  lien: 'Lien',
}

export const VALIDATION_ETAT_LIBELLES: Record<ValidationEtat, string> = {
  0: 'En attente',
  1: 'Non acquis',
  2: 'En cours d’acquisition',
  3: 'Acquis',
}

export const CONCEPTION_IA_LIBELLES: Record<ConceptionIa, string> = {
  non_renseigne: 'Non renseigné',
  aucun: 'Aucun usage de l’IA',
  moyen: 'Je me suis aidé de l’IA pour réfléchir à partir de mes idées',
  avance: 'J’ai rédigé un prompt à partir des consignes pour trouver des idées',
}

export const REALISATION_IA_LIBELLES: Record<RealisationIa, string> = {
  non_renseigne: 'Non renseigné',
  aucun: 'Aucun usage de l’IA',
  peu: 'Quelques éléments du projet ont été générés avec l’IA (moins de 50 %)',
  moyen: 'La plupart des éléments du projet ont été générés avec l’IA (plus de 50 %)',
  avance:
    'J’ai rédigé un prompt à partir des consignes ou le projet a été généré avec l’IA (plus de 90 %)',
}
