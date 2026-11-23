import type { Iri, JsonLdResource } from './api'

/** Structure de l'IUT, synchronisée depuis l'intranet. */

export type GroupeType = 'CM' | 'TD' | 'TP'

export interface Departement extends JsonLdResource {
  '@type': 'Departement'
  libelle: string
}

export interface Diplome extends JsonLdResource {
  '@type': 'Diplome'
  libelle: string
  sigle: string
  departement: Iri
  parcours: Iri | null
}

export interface Annee extends JsonLdResource {
  '@type': 'Annee'
  libelle: string
  ordre: number
  diplome: Iri
}

export interface AnneeUniversitaire extends JsonLdResource {
  '@type': 'AnneeUniversitaire'
  libelle: string
  annee: number
  active: boolean
}

export interface Semestre extends JsonLdResource {
  '@type': 'Semestre'
  libelle: string
  ordre: number
  annee: Iri
}

export interface Groupe extends JsonLdResource {
  '@type': 'Groupe'
  libelle: string
  type: GroupeType
  semestre: Iri
  parcours: Iri | null
}
