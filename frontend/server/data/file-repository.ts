import { createFileRepository } from '../utils/file-repository'

/**
 * Provisoire : fichiers de démonstration, sur le stockage EN MÉMOIRE de Nitro (`useStorage()`),
 * comme les traces : ils disparaissent ensemble au redémarrage (pas de fichier orphelin sur disque).
 */
export const fileRepository = createFileRepository(useStorage())
