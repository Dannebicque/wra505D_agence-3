import { describe, expect, it } from 'vitest'
import { validateTrace } from '../../../shared/utils/trace-validation'

const TODAY = '2026-11-02'
const VALID = {
  titre: 'Refonte du site du BDE',
  description: '',
  contexte: 'Projet tutoré, S3',
  type: 'lien',
  contenu: ['https://bde.example'],
  statut: 'finalisee',
  conceptionIa: 'aucun',
  realisationIa: 'peu',
  dateRealisation: '2026-10-24',
}

const messages = (input: unknown) => {
  const result = validateTrace(input, { today: TODAY })
  return result.ok
    ? {}
    : Object.fromEntries(result.violations.map((v) => [v.propertyPath, v.message]))
}

describe('validateTrace', () => {
  it('accepte une trace complète et normalise les champs vides', () => {
    const result = validateTrace(VALID, { today: TODAY })

    expect(result).toEqual({
      ok: true,
      value: { ...VALID, description: null, titre: 'Refonte du site du BDE' },
    })
  })

  it('exige un titre, même pour un brouillon, et en limite la longueur', () => {
    expect(messages({ ...VALID, statut: 'brouillon', titre: '   ' })).toEqual({
      titre: 'Le titre est obligatoire.',
    })
    expect(messages({ ...VALID, titre: 'a'.repeat(101) })).toEqual({
      titre: 'Le titre ne doit pas dépasser 100 caractères.',
    })
  })

  it('accepte un brouillon sans contenu, mais pas une trace finalisée', () => {
    expect(validateTrace({ ...VALID, statut: 'brouillon', contenu: [] }, { today: TODAY }).ok).toBe(
      true,
    )
    expect(messages({ ...VALID, contenu: [] })).toEqual({
      contenu: 'Ajoutez le contenu de la trace avant de la finaliser.',
    })
  })

  it('n’accepte qu’une adresse web http ou https pour un lien ou une vidéo', () => {
    for (const adresse of ['javascript:alert(1)', 'bde.example', 'ftp://bde.example']) {
      expect(messages({ ...VALID, contenu: [adresse] })).toEqual({
        contenu: 'Saisissez une adresse web valide, commençant par https:// ou http://.',
      })
    }
    expect(
      validateTrace(
        { ...VALID, type: 'video', contenu: ['http://video.example/1'] },
        { today: TODAY },
      ).ok,
    ).toBe(true)
  })

  it('refuse un type, un statut ou une déclaration d’usage de l’IA inconnus', () => {
    expect(
      messages({ ...VALID, type: 'gif', statut: 'publiee', conceptionIa: 'beaucoup' }),
    ).toEqual({
      type: 'Choisissez un type de trace.',
      statut: 'Statut de trace inconnu.',
      conceptionIa: 'Choisissez une déclaration d’usage de l’IA.',
    })
  })

  it('refuse une date de réalisation invalide ou dans le futur', () => {
    expect(messages({ ...VALID, dateRealisation: '2026-02-30' })).toEqual({
      dateRealisation: 'Saisissez une date valide.',
    })
    expect(messages({ ...VALID, dateRealisation: '2026-11-03' })).toEqual({
      dateRealisation: 'La date de réalisation ne peut pas être dans le futur.',
    })
  })

  it('limite la longueur du contexte et de la description', () => {
    expect(
      messages({ ...VALID, contexte: 'a'.repeat(256), description: 'a'.repeat(5001) }),
    ).toEqual({
      contexte: 'Le contexte ne doit pas dépasser 255 caractères.',
      description: 'La description ne doit pas dépasser 5 000 caractères.',
    })
  })

  it('rejette une entrée qui n’est pas un objet', () => {
    expect(validateTrace('n’importe quoi', { today: TODAY }).ok).toBe(false)
    expect(validateTrace(null, { today: TODAY }).ok).toBe(false)
  })

  it('n’accepte qu’une adresse, bornée en longueur, et la nettoie des espaces', () => {
    expect(messages({ ...VALID, contenu: ['https://a.example', 'https://b.example'] })).toEqual({
      contenu: 'Une seule adresse par trace.',
    })
    expect(messages({ ...VALID, contenu: [`https://a.example/${'a'.repeat(2048)}`] })).toEqual({
      contenu: 'L’adresse ne doit pas dépasser 2 048 caractères.',
    })
    const result = validateTrace({ ...VALID, contenu: ['  https://a.example  '] }, { today: TODAY })
    expect(result.ok && result.value.contenu).toEqual(['https://a.example'])
  })
})
