import type { Fichier } from '../../shared/types/fichier'
import type { FileTraceType } from '../../shared/utils/fichier'
import { apiFetch } from './api'

/** Téléverse le fichier d'une trace image ou PDF et renvoie le fichier enregistré. */
export function uploadFichier(file: File, type: FileTraceType): Promise<Fichier> {
  const body = new FormData()
  body.append('type', type)
  body.append('fichier', file)
  return apiFetch<Fichier>('/api/fichiers', { method: 'POST', body })
}
