import type { DateIso, Iri, JsonLdResource } from './api'

/** 0 en attente, 1 non acquis, 2 en cours d'acquisition, 3 acquis. */
export type ValidationEtat = 0 | 1 | 2 | 3

export type NotificationType = 'evaluation' | 'commentaire'

/** Évaluation d'une trace pour un niveau de compétence. Associer une compétence à une trace crée une validation en attente. */
export interface Validation extends JsonLdResource {
  '@type': 'Validation'
  trace: Iri
  niveau: Iri
  /** Null tant que la trace n'a pas été évaluée. */
  enseignant: Iri | null
  etat: ValidationEtat
  dateCreation: DateIso
  dateModification: DateIso | null
}

/** Commentaire d'un enseignant, sur une trace ou sur un portfolio. */
export interface Commentaire extends JsonLdResource {
  '@type': 'Commentaire'
  enseignant: Iri
  trace: Iri | null
  portfolio: Iri | null
  contenu: string
  visibleEtudiant: boolean
  dateCreation: DateIso
  dateModification: DateIso | null
}

/** Nommé ainsi pour ne pas masquer l'API `Notification` du navigateur. */
export interface NotificationUtilisateur extends JsonLdResource {
  '@type': 'Notification'
  destinataire: Iri
  type: NotificationType
  /** Trace à ouvrir depuis la notification. */
  trace: Iri | null
  lu: boolean
  dateCreation: DateIso
}
