import type { Iri, JsonLdResource } from './api'

/**
 * Référentiel de compétences (approche par compétences).
 * Les enfants sont embarqués : le référentiel se lit toujours en entier.
 */

export interface ApprentissageCritique extends JsonLdResource {
  '@type': 'ApprentissageCritique'
  code: string
  libelle: string
}

/** Parcours du diplôme (en B.U.T., certains niveaux 2 et 3 sont propres à un parcours). */
export interface Parcours extends JsonLdResource {
  '@type': 'Parcours'
  libelle: string
  code: string
  referentiel: Iri
}

export interface Niveau extends JsonLdResource {
  '@type': 'Niveau'
  libelle: string
  ordre: number
  annee: Iri | null
  /** Parcours concernés ; tableau vide = niveau commun à tous les parcours. */
  parcours: Iri[]
  apprentissagesCritiques: ApprentissageCritique[]
}

export interface Competence extends JsonLdResource {
  '@type': 'Competence'
  libelle: string
  nomCourt: string
  /** Jeton de thème `c1` à `c5`, traduit en couleur par l'interface. */
  couleur: string
  niveaux: Niveau[]
}

export interface Referentiel extends JsonLdResource {
  '@type': 'Referentiel'
  libelle: string
  departement: Iri | null
  competences: Competence[]
}
