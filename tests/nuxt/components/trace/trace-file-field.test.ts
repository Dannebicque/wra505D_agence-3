import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { File as NodeFile } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import TraceFileField from '~/components/trace/TraceFileField.vue'

const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
const UPLOADED = '/api/fichiers/0b7c1f0e-3a1d-4c55-9a52-2f0e8a9d1c11'

const upload = vi.fn(() => ({
  '@id': UPLOADED,
  '@type': 'Fichier',
  nom: 'affiche.png',
  mimeType: 'image/png',
  taille: 12,
}))
registerEndpoint('/api/fichiers', { method: 'POST', handler: upload })

// `File` de Node : UFileUpload crée un aperçu avec URL.createObjectURL, qui refuse ceux de happy-dom
const fileOf = (content: ConstructorParameters<typeof NodeFile>[0], name: string, type: string) =>
  new NodeFile(content, name, { type }) as unknown as File

async function choose(field: Awaited<ReturnType<typeof mountSuspended>>, file: File) {
  const input = field.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

describe('champ fichier d’une trace', () => {
  it('refuse un fichier au mauvais format sans l’envoyer, et l’explique', async () => {
    upload.mockClear()
    const field = await mountSuspended(TraceFileField, {
      props: { type: 'image', modelValue: null },
    })

    await choose(field, fileOf(['<svg></svg>'], 'logo.png', 'image/png'))

    await vi.waitFor(() =>
      expect(field.text()).toContain('Choisissez une image JPEG, PNG, WebP ou GIF.'),
    )
    expect(upload).not.toHaveBeenCalled()
    expect(field.emitted('update:modelValue')).toBeUndefined()
  })

  it('refuse un fichier trop lourd sans l’envoyer', async () => {
    upload.mockClear()
    const field = await mountSuspended(TraceFileField, {
      props: { type: 'image', modelValue: null },
    })
    const heavy = new Uint8Array(2 * 1024 * 1024 + 1)
    heavy.set(PNG_BYTES)

    await choose(field, fileOf([heavy], 'enorme.png', 'image/png'))

    await vi.waitFor(() =>
      expect(field.text()).toContain('Le fichier dépasse la taille maximale (2 Mo).'),
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it('envoie une image valide et transmet l’adresse du fichier enregistré', async () => {
    upload.mockClear()
    const field = await mountSuspended(TraceFileField, {
      props: { type: 'image', modelValue: null },
    })

    await choose(field, fileOf([new Uint8Array(PNG_BYTES)], 'affiche.png', 'image/png'))

    await vi.waitFor(() => expect(field.emitted('update:modelValue')?.[0]).toEqual([UPLOADED]))
    expect(upload).toHaveBeenCalledOnce()
  })

  it('affiche le fichier en place et propose de le remplacer', async () => {
    const field = await mountSuspended(TraceFileField, {
      props: { type: 'pdf', modelValue: '/fichiers/etude-ux.pdf' },
    })

    expect(field.text()).toContain('etude-ux.pdf')
    expect(field.text()).toContain('Remplacer')
  })
})
