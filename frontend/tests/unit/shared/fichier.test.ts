import { describe, expect, it } from 'vitest'
import { checkFile, detectFileKind, FILE_RULES, formatSize } from '../../../shared/utils/fichier'

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)])
const ascii = (text: string) =>
  new Uint8Array([...new TextEncoder().encode(text), ...new Array(16).fill(0)])

describe('detectFileKind', () => {
  it.each([
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0)],
    ['png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
    ['gif', ascii('GIF89a')],
    ['webp', ascii('RIFF\u0000\u0000\u0000\u0000WEBP')],
    ['pdf', ascii('%PDF-1.7')],
  ])('reconnaît un fichier %s à ses premiers octets', (kind, content) => {
    expect(detectFileKind(content)).toBe(kind)
  })

  it.each([
    ['un SVG', ascii('<svg xmlns="http://www.w3.org/2000/svg">')],
    ['un texte renommé', ascii('Bonjour, je ne suis pas une image')],
    ['un fichier vide', new Uint8Array()],
  ])('ne reconnaît pas %s', (_, content) => {
    expect(detectFileKind(content)).toBeNull()
  })
})

describe('checkFile', () => {
  it('accepte une image reconnue sous la taille maximale', () => {
    expect(checkFile('image', { size: 1024, kind: 'png' })).toBeNull()
    expect(checkFile('pdf', { size: 5 * 1024 * 1024, kind: 'pdf' })).toBeNull()
  })

  it('refuse un format qui ne correspond pas au type de trace', () => {
    expect(checkFile('image', { size: 1024, kind: 'pdf' })).toBe(
      'Choisissez une image JPEG, PNG, WebP ou GIF.',
    )
    expect(checkFile('image', { size: 1024, kind: null })).toBe(
      'Choisissez une image JPEG, PNG, WebP ou GIF.',
    )
    expect(checkFile('pdf', { size: 1024, kind: 'jpeg' })).toBe('Choisissez un fichier PDF.')
  })

  it('refuse un fichier vide ou trop lourd', () => {
    expect(checkFile('image', { size: 0, kind: 'png' })).toBe('Le fichier est vide.')
    expect(checkFile('image', { size: FILE_RULES.image.maxBytes + 1, kind: 'png' })).toBe(
      'Le fichier dépasse la taille maximale (2 Mo).',
    )
    expect(checkFile('pdf', { size: FILE_RULES.pdf.maxBytes + 1, kind: 'pdf' })).toBe(
      'Le fichier dépasse la taille maximale (10 Mo).',
    )
  })
})

describe('formatSize', () => {
  it('affiche une taille lisible en français', () => {
    expect(formatSize(512)).toBe('512 o')
    expect(formatSize(1536)).toBe('1,5 Ko')
    expect(formatSize(2 * 1024 * 1024)).toBe('2 Mo')
  })
})
