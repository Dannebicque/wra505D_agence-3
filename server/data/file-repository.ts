import { createFileRepository } from '../utils/file-repository'

/** Provisoire : fichiers de démonstration, sur le stockage `data` de Nitro (dossier `.data/`). */
export const fileRepository = createFileRepository(useStorage('data'))
