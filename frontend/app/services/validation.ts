import type { Validation } from '#shared/types/evaluation'
import { apiFetchAll, type ApiFetchOptions } from './api'

/** Validations des traces de l'utilisateur, toutes pages confondues. */
export function listValidations(options?: ApiFetchOptions): Promise<Validation[]> {
  return apiFetchAll<Validation>('/api/validations', options)
}
