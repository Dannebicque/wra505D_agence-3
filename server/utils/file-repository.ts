// Fichiers de démonstration (phase Nitro, provisoire : remplacé par le téléversement d'ApiPlatform).
// Chaque visiteur ne voit que ses fichiers. Module pur : le stockage est injecté (`useStorage()` de
// Nitro en production, un stockage en mémoire dans les tests).
import type { FileKind, Fichier } from '../../shared/types/fichier'
import { MIME_TYPES } from '../../shared/utils/fichier'
import { iri } from '../../shared/utils/iri'

/** Sous-ensemble de l'interface `Storage` d'unstorage utilisé ici. */
export interface BlobStore {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown) => Promise<void>
  getItemRaw: (key: string) => Promise<unknown>
  setItemRaw: (key: string, value: unknown) => Promise<void>
}

interface FileMeta {
  id: string
  nom: string
  kind: FileKind
  taille: number
}

const MO = 1024 * 1024

/** Nom affichable et sans danger : pas de chemin, pas de caractères spéciaux. */
function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base
    .replace(/[^\p{L}\p{N} ._-]+/gu, '_')
    .replace(/^[_.\s]+/, '')
    .slice(0, 100)
  return cleaned || 'fichier'
}

const toFichier = (meta: FileMeta): Fichier => ({
  '@id': iri('fichiers', meta.id),
  '@type': 'Fichier',
  nom: meta.nom,
  mimeType: MIME_TYPES[meta.kind],
  taille: meta.taille,
})

export function createFileRepository(store: BlobStore, { maxFiles = 10, maxBytes = 30 * MO } = {}) {
  const indexKey = (session: string) => `fichiers:${session}:index`
  const bytesKey = (session: string, id: string) => `fichiers:${session}:${id}`

  async function index(session: string): Promise<FileMeta[]> {
    const value = await store.getItem(indexKey(session))
    return Array.isArray(value) ? (value as FileMeta[]) : []
  }

  return {
    async save(
      session: string,
      file: { name: string; kind: FileKind; bytes: Uint8Array },
    ): Promise<Fichier | { error: string }> {
      const files = await index(session)
      if (files.length >= maxFiles) {
        return { error: 'Vous avez atteint le nombre maximal de fichiers de démonstration.' }
      }
      const used = files.reduce((total, f) => total + f.taille, 0)
      if (used + file.bytes.length > maxBytes) {
        return { error: 'Vous avez atteint l’espace maximal de fichiers de démonstration.' }
      }

      const meta: FileMeta = {
        id: crypto.randomUUID(),
        nom: cleanName(file.name),
        kind: file.kind,
        taille: file.bytes.length,
      }
      await store.setItemRaw(bytesKey(session, meta.id), file.bytes)
      await store.setItem(indexKey(session), [...files, meta])
      return toFichier(meta)
    },

    async get(
      session: string,
      id: string,
    ): Promise<{ fichier: Fichier; kind: FileKind; bytes: Uint8Array } | null> {
      const meta = (await index(session)).find((f) => f.id === id)
      if (!meta) return null
      const raw = await store.getItemRaw(bytesKey(session, meta.id))
      if (!raw) return null
      const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer)
      return { fichier: toFichier(meta), kind: meta.kind, bytes }
    },
  }
}
