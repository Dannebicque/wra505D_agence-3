/**
 * Données factices (phase Nitro). Provisoire : les traces de l'étudiante de démo, cohérentes avec
 * la maquette A ; à reprendre par le back (routes traces, Sprint 1).
 */
import type { Trace, TraceStatut, TraceType } from '../../shared/types/trace'
import { iri } from '../../shared/utils/iri'

const BIBLIOTHEQUE = iri('bibliotheques', 1)

function trace(
  id: number,
  titre: string,
  type: TraceType,
  statut: TraceStatut,
  date: string,
  contenu: string,
): Trace {
  return {
    '@id': iri('traces', id),
    '@type': 'Trace',
    bibliotheque: BIBLIOTHEQUE,
    titre,
    description: null,
    contexte: null,
    legende: null,
    type,
    contenu: [contenu],
    statut,
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
    dateRealisation: date,
    dateCreation: date,
    dateModification: statut === 'brouillon' ? date : null,
    dateSuppression: null,
  }
}

export const TRACES: readonly Trace[] = [
  trace(1, 'Refonte du site du BDE', 'lien', 'finalisee', '2026-10-24', 'https://bde.example'),
  trace(
    2,
    'Affiche du festival Court Toujours',
    'image',
    'finalisee',
    '2026-10-28',
    '/fichiers/affiche-court-toujours.jpg',
  ),
  trace(
    3,
    'Étude UX de l’appli Fil Bleu',
    'pdf',
    'finalisee',
    '2026-10-21',
    '/fichiers/etude-ux-fil-bleu.pdf',
  ),
  trace(
    4,
    'Générique des portes ouvertes',
    'video',
    'finalisee',
    '2026-10-22',
    'https://video.example/generique-jpo',
  ),
  trace(
    5,
    'API de réservation de salles',
    'lien',
    'finalisee',
    '2026-10-15',
    'https://git.example/reservation-salles',
  ),
  trace(
    6,
    'Charte graphique de Grimp’Tours',
    'pdf',
    'finalisee',
    '2026-10-18',
    '/fichiers/charte-grimptours.pdf',
  ),
  trace(
    7,
    'Business model d’une appli de covoiturage',
    'pdf',
    'brouillon',
    '2026-10-30',
    '/fichiers/business-model-covoiturage.pdf',
  ),
  trace(
    8,
    'Podcast : interview d’une ancienne étudiante',
    'lien',
    'brouillon',
    '2026-10-29',
    'https://podcast.example/alumni',
  ),
]
