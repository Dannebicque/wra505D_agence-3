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

async function choose(
  field: Awaited<ReturnType<typeof mountSuspended<typeof TraceFileField>>>,
  file: File,
) {
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

  describe('accessibilité', () => {
    const describedBy = (
      field: Awaited<ReturnType<typeof mountSuspended<typeof TraceFileField>>>,
    ) =>
      (field.get('button[name="fichier"]').attributes('aria-describedby') ?? '')
        .split(' ')
        .map((id) => field.find(`[id="${id}"]`))
        .filter((el) => el.exists())
        .map((el) => el.text())
        .join(' ')

    it('donne au bouton un nom et une description (type, formats acceptés)', async () => {
      const field = await mountSuspended(TraceFileField, {
        props: { type: 'image', modelValue: null },
      })
      const button = field.get('button[name="fichier"]')

      const labels = (button.attributes('aria-labelledby') ?? '')
        .split(' ')
        .map((id) => field.find(`[id="${id}"]`).text())
      expect(labels.join(' ')).toContain('Image')
      expect(describedBy(field)).toContain('JPEG, PNG, WebP ou GIF')
    })

    it('relie l’erreur au bouton et l’annonce', async () => {
      const field = await mountSuspended(TraceFileField, {
        props: { type: 'pdf', modelValue: null },
      })

      await choose(field, fileOf(['texte'], 'notes.pdf', 'application/pdf'))

      await vi.waitFor(() => expect(describedBy(field)).toContain('Choisissez un fichier PDF.'))
      expect(field.get('button[name="fichier"]').attributes('aria-invalid')).toBe('true')
      expect(field.get('[role="status"]').text()).toContain('Choisissez un fichier PDF.')
    })

    it('annonce le fichier déposé', async () => {
      const field = await mountSuspended(TraceFileField, {
        props: { type: 'image', modelValue: null },
      })

      await choose(field, fileOf([new Uint8Array(PNG_BYTES)], 'affiche.png', 'image/png'))

      await vi.waitFor(() =>
        expect(field.get('[role="status"]').text()).toContain('affiche.png déposé'),
      )
    })

    it('affiche une erreur venue du formulaire', async () => {
      const field = await mountSuspended(TraceFileField, {
        props: { type: 'image', modelValue: null, formError: 'Ajoutez le contenu de la trace.' },
      })

      expect(describedBy(field)).toContain('Ajoutez le contenu de la trace.')
    })
  })

  // Un fichier glissé hors des formats acceptés n'est plus ignoré en silence
  it('traite un fichier glissé dans la zone, avec un message s’il est refusé', async () => {
    const field = await mountSuspended(TraceFileField, {
      props: { type: 'image', modelValue: null },
    })
    const file = fileOf(['<svg></svg>'], 'logo.svg', 'image/svg+xml')

    await field.get('[data-zone="depot"]').trigger('drop', { dataTransfer: { files: [file] } })

    await vi.waitFor(() =>
      expect(field.text()).toContain('Choisissez une image JPEG, PNG, WebP ou GIF.'),
    )
  })
})
