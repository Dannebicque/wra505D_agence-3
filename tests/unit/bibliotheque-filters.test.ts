import { describe, expect, it } from 'vitest'
import type { Validation } from '../../shared/types/evaluation'
import type { Competence, Referentiel } from '../../shared/types/referentiel'
import type { Trace } from '../../shared/types/trace'
import {
  DEFAULT_BIBLIOTHEQUE_CRITERIA,
  bibliothequeCriteriaFromQuery,
  bibliothequeCriteriaToQuery,
  filterBibliotheque,
  tracesWithCompetences,
  withKnownCompetence,
  type BibliothequeCriteria,
} from '../../app/utils/bibliotheque-filters'

function competence(id: number, nomCourt: string, niveaux: number[]): Competence {
  return {
    '@id': `/api/competences/${id}`,
    '@type': 'Competence',
    libelle: `${nomCourt} un produit`,
    nomCourt,
    couleur: `c${id}`,
    niveaux: niveaux.map((n) => ({
      '@id': `/api/niveaux/${n}`,
      '@type': 'Niveau',
      libelle: `Niveau ${n}`,
      ordre: n,
      annee: null,
      parcours: [],
      apprentissagesCritiques: [],
    })),
  }
}

const DEVELOPPER = competence(4, 'Développer', [10, 11])
const EXPRIMER = competence(3, 'Exprimer', [7, 8])
const REFERENTIEL: Referentiel = {
  '@id': '/api/referentiels/1',
  '@type': 'Referentiel',
  libelle: 'B.U.T. MMI',
  departement: null,
  competences: [EXPRIMER, DEVELOPPER],
}

function trace(id: number, overrides: Partial<Trace> = {}): Trace {
  return {
    '@id': `/api/traces/${id}`,
    '@type': 'Trace',
    bibliotheque: '/api/bibliotheques/1',
    titre: `Trace ${id}`,
    description: null,
    contexte: null,
    legende: null,
    type: 'lien',
    contenu: [],
    statut: 'finalisee',
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
    dateRealisation: null,
    dateCreation: '2026-10-01',
    dateModification: null,
    dateSuppression: null,
    ...overrides,
  }
}

function validation(id: number, traceId: number, niveau: number): Validation {
  return {
    '@id': `/api/validations/${id}`,
    '@type': 'Validation',
    trace: `/api/traces/${traceId}`,
    niveau: `/api/niveaux/${niveau}`,
    enseignant: null,
    etat: 0,
    dateCreation: '2026-10-25',
    dateModification: null,
  }
}

describe('tracesWithCompetences', () => {
  it('range les traces de la plus récemment touchée à la plus ancienne', () => {
    const items = tracesWithCompetences(
      [
        trace(1, { dateCreation: '2026-10-01' }),
        // Créée en premier, mais modifiée en dernier : la modification compte
        trace(2, { dateCreation: '2026-09-01', dateModification: '2026-10-20' }),
        trace(3, { dateCreation: '2026-10-10' }),
      ],
      [],
      REFERENTIEL,
    )

    expect(items.map((i) => i.trace['@id'])).toEqual([
      '/api/traces/2',
      '/api/traces/3',
      '/api/traces/1',
    ])
  })

  it('donne les compétences de chaque trace dans l’ordre du référentiel, sans doublon', () => {
    const [item] = tracesWithCompetences(
      [trace(1)],
      [validation(1, 1, 11), validation(2, 1, 10), validation(3, 1, 8)],
      REFERENTIEL,
    )

    expect(item?.competences.map((c) => c.nomCourt)).toEqual(['Exprimer', 'Développer'])
  })

  it('ignore les validations d’une autre trace et les niveaux hors référentiel', () => {
    const [item] = tracesWithCompetences(
      [trace(1)],
      [validation(1, 2, 8), validation(2, 1, 999)],
      REFERENTIEL,
    )

    expect(item?.competences).toEqual([])
  })

  it('laisse les traces sans compétence quand le référentiel manque', () => {
    const [item] = tracesWithCompetences([trace(1)], [validation(1, 1, 8)], null)

    expect(item?.competences).toEqual([])
  })
})

describe('critères dans l’URL', () => {
  it('donne les critères par défaut sans paramètre', () => {
    expect(bibliothequeCriteriaFromQuery({})).toEqual(DEFAULT_BIBLIOTHEQUE_CRITERIA)
  })

  it('relit les valeurs de l’URL', () => {
    expect(
      bibliothequeCriteriaFromQuery({ recherche: 'bde', statut: 'brouillon', competence: '4' }),
    ).toEqual({ recherche: 'bde', statut: 'brouillon', competence: '4' })
  })

  it('retombe sur « tous » pour un statut inconnu', () => {
    expect(bibliothequeCriteriaFromQuery({ statut: 'archivee' }).statut).toBe('tous')
  })

  it('ignore un paramètre répété', () => {
    expect(bibliothequeCriteriaFromQuery({ recherche: ['a', 'b'] }).recherche).toBe('')
  })

  it('n’écrit dans l’URL que les critères actifs', () => {
    expect(
      bibliothequeCriteriaToQuery({ recherche: '', statut: 'finalisee', competence: 'tous' }),
    ).toEqual({ statut: 'finalisee' })
  })
})

describe('withKnownCompetence', () => {
  const competences = [EXPRIMER, DEVELOPPER]

  it('garde une compétence du référentiel', () => {
    const criteria: BibliothequeCriteria = { recherche: '', statut: 'tous', competence: '4' }

    expect(withKnownCompetence(criteria, competences).competence).toBe('4')
  })

  it('remplace une compétence inconnue par « toutes », sans toucher au reste', () => {
    const criteria: BibliothequeCriteria = {
      recherche: 'bde',
      statut: 'brouillon',
      competence: '999',
    }

    expect(withKnownCompetence(criteria, competences)).toEqual({
      recherche: 'bde',
      statut: 'brouillon',
      competence: 'tous',
    })
  })
})

describe('filterBibliotheque', () => {
  const items = tracesWithCompetences(
    [
      trace(1, { titre: 'Refonte du site du BDE', dateCreation: '2026-10-03' }),
      trace(2, {
        titre: 'Affiche',
        statut: 'brouillon',
        description: 'Campagne pour l’été',
        dateCreation: '2026-10-02',
      }),
      trace(3, { titre: 'Podcast', contexte: 'Projet tutoré', dateCreation: '2026-10-01' }),
    ],
    [validation(1, 1, 11), validation(2, 2, 8), validation(3, 3, 8)],
    REFERENTIEL,
  )
  const titres = (criteria: Partial<BibliothequeCriteria>) =>
    filterBibliotheque(items, { ...DEFAULT_BIBLIOTHEQUE_CRITERIA, ...criteria }).map(
      (i) => i.trace.titre,
    )

  it('garde tout sans critère', () => {
    expect(titres({})).toEqual(['Refonte du site du BDE', 'Affiche', 'Podcast'])
  })

  it.each([
    ['le titre', 'REFONTE', 'Refonte du site du BDE'],
    ['la description, sans les accents', 'ete', 'Affiche'],
    ['le contexte', 'tutoré', 'Podcast'],
    ['le nom d’une compétence', 'developper', 'Refonte du site du BDE'],
  ])('trouve par %s', (_, recherche, titre) => {
    expect(titres({ recherche })).toEqual([titre])
  })

  it('ignore les espaces autour de la recherche', () => {
    expect(titres({ recherche: '  podcast ' })).toEqual(['Podcast'])
  })

  it('ne trouve rien sans correspondance', () => {
    expect(titres({ recherche: 'introuvable' })).toEqual([])
  })

  it('filtre par statut', () => {
    expect(titres({ statut: 'brouillon' })).toEqual(['Affiche'])
    expect(titres({ statut: 'finalisee' })).toEqual(['Refonte du site du BDE', 'Podcast'])
  })

  it('filtre par compétence', () => {
    expect(titres({ competence: '3' })).toEqual(['Affiche', 'Podcast'])
    expect(titres({ competence: '4' })).toEqual(['Refonte du site du BDE'])
  })

  it('combine les critères', () => {
    expect(titres({ statut: 'finalisee', competence: '3' })).toEqual(['Podcast'])
    expect(titres({ recherche: 'affiche', statut: 'finalisee' })).toEqual([])
  })
})
