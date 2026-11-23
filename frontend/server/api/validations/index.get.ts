import { VALIDATIONS } from '../../data/validations'

// Provisoire : renvoie les validations de l'étudiante de démo.
export default defineEventHandler((event) =>
  toCollection('/api/validations', VALIDATIONS, getQuery(event)),
)
