import { describe, expect, it } from 'vitest'
import { createFileRepository, type BlobStore } from '../../../server/utils/file-repository'

/** Stockage en mémoire, même interface que `useStorage()` de Nitro. */
function memoryStore(): BlobStore {
  const items = new Map<string, unknown>()
  return {
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => void items.set(key, value),
    getItemRaw: async (key) => items.get(key) ?? null,
    setItemRaw: async (key, value) => void items.set(key, value),
  }
}

const PNG = { name: 'affiche.png', kind: 'png' as const, bytes: new Uint8Array(1000) }

describe('dépôt de fichiers de démonstration', () => {
  it('enregistre un fichier et le relit, réservé au visiteur qui l’a déposé', async () => {
    const repo = createFileRepository(memoryStore())

    const saved = await repo.save('visiteur-a', PNG)

    expect(saved).toMatchObject({
      '@type': 'Fichier',
      nom: 'affiche.png',
      mimeType: 'image/png',
      taille: 1000,
    })
    expect(saved && 'error' in saved).toBe(false)
    const id =
      String((saved as { '@id': string })['@id'])
        .split('/')
        .pop() ?? ''
    expect((await repo.get('visiteur-a', id))?.bytes).toHaveLength(1000)
    expect(await repo.get('visiteur-b', id)).toBeNull()
  })

  it('donne un identifiant impossible à deviner', async () => {
    const repo = createFileRepository(memoryStore())

    const saved = await repo.save('a', PNG)

    expect((saved as { '@id': string })['@id']).toMatch(/^\/api\/fichiers\/[0-9a-f-]{36}$/)
  })

  it('limite le nombre et le poids des fichiers par visiteur', async () => {
    const repo = createFileRepository(memoryStore(), { maxFiles: 2, maxBytes: 2500 })

    await repo.save('a', PNG)
    await repo.save('a', PNG)
    expect(await repo.save('a', PNG)).toEqual({
      error: 'Vous avez atteint le nombre maximal de fichiers de démonstration.',
    })

    const heavy = createFileRepository(memoryStore(), { maxFiles: 10, maxBytes: 1500 })
    await heavy.save('a', PNG)
    expect(await heavy.save('a', PNG)).toEqual({
      error: 'Vous avez atteint l’espace maximal de fichiers de démonstration.',
    })
  })

  it('nettoie le nom du fichier', async () => {
    const repo = createFileRepository(memoryStore())

    const saved = await repo.save('a', { ...PNG, name: '../../<script>affiche finale.png' })

    expect((saved as { nom: string }).nom).toBe('script_affiche finale.png')
  })
})
