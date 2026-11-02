import { TRACES } from '../../data/traces'

// Provisoire : renvoie les traces de l'étudiante de démo, hors corbeille.
// Avec l'authentification, le back filtrera sur la bibliothèque de l'utilisateur connecté.
export default defineEventHandler((event) =>
  toCollection(
    '/api/traces',
    TRACES.filter((trace) => trace.dateSuppression === null),
    getQuery(event),
  ),
)
