/**
 * Données factices du référentiel (phase Nitro, avant ApiPlatform).
 * Compétences et niveaux : libellés réels du B.U.T. MMI, repris des fixtures de l'ancienne version.
 * Apprentissages critiques : libellés FACTICES (l'ancienne version ne les fournit pas, ils viennent de l'intranet).
 */
import type {
  ApprentissageCritique,
  Competence,
  Niveau,
  Referentiel,
} from '../../shared/types/referentiel'
import { iri } from '../../shared/utils/iri'

const APPRENTISSAGES_PAR_NIVEAU = 2

const COMPETENCES_MMI = [
  {
    libelle:
      'Comprendre les écosystèmes, les besoins des utilisateurs et les dispositifs de communication numérique',
    nomCourt: 'Comprendre',
    niveaux: [
      'Comprendre les éléments de communication et les attentes utilisateurs',
      'Comprendre la stratégie de communication et l’expérience utilisateur',
      'Comprendre les écosystèmes, les besoins des utilisateurs et les dispositifs de communication numérique',
    ],
  },
  {
    libelle:
      'Concevoir ou co-concevoir une réponse stratégique pertinente à une problématique complexe',
    nomCourt: 'Concevoir',
    niveaux: [
      'Concevoir une réponse stratégique',
      'Co-concevoir une réponse stratégique',
      'Co-concevoir une réponse stratégique complexe et prospective',
    ],
  },
  {
    libelle: 'Exprimer un message avec les médias numériques pour informer et communiquer',
    nomCourt: 'Exprimer',
    niveaux: [
      'Exprimer un message par des productions simples',
      'Exprimer une identité visuelle et éditoriale trans-média',
      'Exprimer un récit interactif et une direction artistique',
    ],
  },
  {
    libelle: 'Développer pour le web et les médias numériques',
    nomCourt: 'Développer',
    niveaux: [
      'Développer un site web simple et le met en ligne',
      'Développer une application Web interactive',
      'Développer un écosystème numérique complexe',
    ],
  },
  {
    libelle: 'Entreprendre dans le secteur du numérique',
    nomCourt: 'Entreprendre',
    niveaux: [
      'Entreprendre un projet numérique',
      'Entreprendre un projet au sein d’un écosystème numérique',
      'Entreprendre dans le numérique',
    ],
  },
] as const

// Compteurs pour des IRI uniques et stables, dans l'ordre de déclaration
let niveauId = 0
let apprentissageId = 0

function buildApprentissages(
  numeroCompetence: number,
  ordre: number,
  nomCourt: string,
): ApprentissageCritique[] {
  return Array.from({ length: APPRENTISSAGES_PAR_NIVEAU }, (_, index) => ({
    '@id': iri('apprentissages_critiques', ++apprentissageId),
    '@type': 'ApprentissageCritique',
    code: `AC${numeroCompetence}${ordre}.0${index + 1}`,
    libelle: `${nomCourt}, niveau ${ordre} : apprentissage critique ${index + 1} (donnée factice)`,
  }))
}

const competences: Competence[] = COMPETENCES_MMI.map((competence, index) => {
  const numero = index + 1
  const niveaux: Niveau[] = competence.niveaux.map((libelle, niveauIndex) => ({
    '@id': iri('niveaux', ++niveauId),
    '@type': 'Niveau',
    libelle,
    ordre: niveauIndex + 1,
    annee: null,
    parcours: [],
    apprentissagesCritiques: buildApprentissages(numero, niveauIndex + 1, competence.nomCourt),
  }))

  return {
    '@id': iri('competences', numero),
    '@type': 'Competence',
    libelle: competence.libelle,
    nomCourt: competence.nomCourt,
    couleur: `c${numero}`,
    niveaux,
  }
})

export const REFERENTIELS: readonly Referentiel[] = [
  {
    '@id': iri('referentiels', 1),
    '@type': 'Referentiel',
    libelle: 'Référentiel de compétences du B.U.T. MMI',
    departement: null,
    competences,
  },
]
