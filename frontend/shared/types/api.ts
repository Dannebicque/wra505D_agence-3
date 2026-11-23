/** IRI d'une ressource, au format ApiPlatform (ex. `/api/traces/12`). */
export type Iri = `/api/${string}`

/** Date ou date-heure au format ISO 8601. */
export type DateIso = string

/** Champs JSON-LD présents sur toute ressource. */
export interface JsonLdResource {
  '@id': Iri
  '@type': string
}

/** Liens de pagination d'une collection (présents seulement s'il y a plusieurs pages). */
export interface HydraView {
  '@id': string
  '@type': 'PartialCollectionView'
  first?: string
  last?: string
  previous?: string
  next?: string
}

/** Collection paginée, au format ApiPlatform 4 (sans préfixe `hydra:`). */
export interface HydraCollection<T> {
  '@context'?: string
  '@id': string
  '@type': 'Collection'
  totalItems: number
  member: T[]
  view?: HydraView
}

/** Erreur de validation d'un champ, au format ApiPlatform (`ConstraintViolationList`). */
export interface Violation {
  propertyPath: string
  message: string
}
