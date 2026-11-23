import { describe, expect, it } from 'vitest'
import { PAGE_LIMITS, validatePage } from '../../../shared/utils/page-validation'

describe('validatePage', () => {
  it('normalise l’intitulé et une description vide', () => {
    expect(validatePage({ intitule: '  Projet ', description: '   ' })).toEqual({
      ok: true,
      value: { intitule: 'Projet', description: null },
    })
  })

  it('accepte les longueurs maximales', () => {
    const result = validatePage({
      intitule: 'a'.repeat(PAGE_LIMITS.intitule),
      description: 'b'.repeat(PAGE_LIMITS.description),
    })

    expect(result.ok).toBe(true)
  })

  it.each([
    ['intitule', { intitule: '   ' }, 'L’intitulé est obligatoire.'],
    ['intitule', { intitule: 12 }, 'L’intitulé est obligatoire.'],
    [
      'intitule',
      { intitule: 'a'.repeat(PAGE_LIMITS.intitule + 1) },
      'L’intitulé ne doit pas dépasser 100 caractères.',
    ],
    [
      'description',
      { intitule: 'Projet', description: 'b'.repeat(PAGE_LIMITS.description + 1) },
      'La description ne doit pas dépasser 500 caractères.',
    ],
  ])('refuse un champ %s invalide (%#)', (propertyPath, input, message) => {
    expect(validatePage(input)).toEqual({ ok: false, violations: [{ propertyPath, message }] })
  })

  it.each([[null], ['texte'], [[]]])('refuse un corps invalide : %j', (input) => {
    expect(validatePage(input)).toEqual({
      ok: false,
      violations: [{ propertyPath: '', message: 'Page invalide.' }],
    })
  })
})
