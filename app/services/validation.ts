import type { HydraCollection } from '#shared/types/api'
import type { Validation } from '#shared/types/evaluation'
import { apiFetch } from './api'

/** Validations des traces de l'utilisateur (première page de la collection). */
export async function listValidations(): Promise<Validation[]> {
  const collection = await apiFetch<HydraCollection<Validation>>('/api/validations')
  return collection.member
}
