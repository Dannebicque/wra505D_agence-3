import type { DateIso, Iri, JsonLdResource } from './api'

export type TraceType = 'image' | 'pdf' | 'video' | 'lien'

/** « À compléter » (point ouvert n° 9 de FONCTIONNALITES.md) s'ajoutera ici si le client le retient. */
export type TraceStatut = 'brouillon' | 'finalisee'

/** Usage de l'IA pendant la conception de la trace. */
export type ConceptionIa = 'non_renseigne' | 'aucun' | 'moyen' | 'avance'

/** Usage de l'IA pendant la réalisation de la trace. */
export type RealisationIa = 'non_renseigne' | 'aucun' | 'peu' | 'moyen' | 'avance'

/** Bibliothèque d'un étudiant pour une année : contient ses traces. */
export interface Bibliotheque extends JsonLdResource {
  '@type': 'Bibliotheque'
  etudiant: Iri
  annee: Iri
  anneeUniversitaire: Iri
}

export interface Trace extends JsonLdResource {
  '@type': 'Trace'
  bibliotheque: Iri
  titre: string
  description: string | null
  contexte: string | null
  legende: string | null
  type: TraceType
  /** URL ou chemin de fichier, selon le type. */
  contenu: string[]
  statut: TraceStatut
  conceptionIa: ConceptionIa
  realisationIa: RealisationIa
  dateRealisation: DateIso | null
  dateCreation: DateIso
  dateModification: DateIso | null
  /** Renseignée quand la trace est dans la corbeille. */
  dateSuppression: DateIso | null
}
