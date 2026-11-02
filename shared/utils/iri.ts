import type { Iri } from '../types/api'

/** Construit l'IRI ApiPlatform d'une ressource : `iri('traces', 12)` → `/api/traces/12`. */
export function iri(resource: string, id: string | number): Iri {
  return `/api/${resource}/${id}`
}

/** Renvoie l'identifiant contenu dans le dernier segment d'un IRI. */
export function idFromIri(value: Iri): string {
  return value.slice(value.lastIndexOf('/') + 1)
}
