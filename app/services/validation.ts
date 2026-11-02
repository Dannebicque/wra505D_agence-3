import type { Validation } from '#shared/types/evaluation'
import { apiFetchAll } from './api'

/** Validations des traces de l'utilisateur, toutes pages confondues. */
export function listValidations(): Promise<Validation[]> {
  return apiFetchAll<Validation>('/api/validations')
}
