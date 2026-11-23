import { REFERENTIELS } from '../../data/referentiels'

export default defineEventHandler((event) =>
  toCollection('/api/referentiels', REFERENTIELS, getQuery(event)),
)
