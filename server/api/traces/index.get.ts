import { traceRepository } from '../../data/trace-repository'

// Provisoire : traces du visiteur (cookie de démo), hors corbeille.
// Avec l'authentification, le back filtrera sur la bibliothèque de l'utilisateur connecté.
export default defineEventHandler((event) =>
  toCollection('/api/traces', traceRepository.list(event.context.demoSession), getQuery(event)),
)
