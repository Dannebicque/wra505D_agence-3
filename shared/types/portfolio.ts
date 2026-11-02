import type { DateIso, Iri, JsonLdResource } from './api'

export type PortfolioVisibilite = 'publique' | 'privee'

export interface Portfolio extends JsonLdResource {
  '@type': 'Portfolio'
  etudiant: Iri
  annee: Iri
  intitule: string
  description: string | null
  banniere: string | null
  visibilite: PortfolioVisibilite
  visibleRecruteurs: boolean
  /** Pages dans leur ordre d'affichage. */
  pages: Iri[]
  dateCreation: DateIso
  dateModification: DateIso | null
  /** Renseignée quand le portfolio est dans la corbeille. */
  dateSuppression: DateIso | null
}

/** Page d'un portfolio : correspond à un projet. */
export interface Page extends JsonLdResource {
  '@type': 'Page'
  portfolio: Iri
  intitule: string
  description: string | null
  /** Traces dans leur ordre d'affichage. */
  traces: Iri[]
  /** Renseignée quand la page est dans la corbeille. */
  dateSuppression: DateIso | null
}
