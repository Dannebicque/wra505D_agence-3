import { describe, expect, it } from 'vitest'
import type { Trace } from '../../../shared/types/trace'
import { fileFieldViolations, mergeTracePatch } from '../../../server/utils/trace-patch'

const EXISTING: Trace = {
  '@id': '/api/traces/3',
  '@type': 'Trace',
  bibliotheque: '/api/bibliotheques/1',
  titre: 'Étude UX',
  description: 'Analyse',
  contexte: null,
  legende: null,
  type: 'pdf',
  contenu: ['/fichiers/etude-ux.pdf'],
  statut: 'finalisee',
  conceptionIa: 'aucun',
  realisationIa: 'aucun',
  dateRealisation: '2026-10-21',
  dateCreation: '2026-10-21',
  dateModification: null,
  dateSuppression: null,
}

describe('mergeTracePatch', () => {
  it('ne change que les champs modifiables envoyés et garde les autres', () => {
    const merged = mergeTracePatch(EXISTING, { titre: 'Nouveau', description: null })

    expect(merged).toMatchObject({
      titre: 'Nouveau',
      description: null,
      type: 'pdf',
      statut: 'finalisee',
    })
  })

  it('ignore les champs non modifiables (IRI, bibliothèque, dates)', () => {
    const merged = mergeTracePatch(EXISTING, {
      '@id': '/api/traces/999',
      bibliotheque: '/api/bibliotheques/2',
      dateCreation: '2000-01-01',
      dateSuppression: '2026-11-01',
    })

    expect(Object.keys(merged)).not.toContain('@id')
    expect(Object.keys(merged)).not.toContain('bibliotheque')
    expect(Object.keys(merged)).not.toContain('dateCreation')
    expect(Object.keys(merged)).not.toContain('dateSuppression')
  })
})

describe('fileFieldViolations', () => {
  const UPLOADED = '/api/fichiers/0b7c1f0e-3a1d-4c55-9a52-2f0e8a9d1c11'

  it('accepte une image déposée par le visiteur, du bon format', () => {
    expect(fileFieldViolations(null, { type: 'image', contenu: [UPLOADED] }, 'png')).toEqual([])
    expect(fileFieldViolations(EXISTING, { type: 'pdf', contenu: [UPLOADED] }, 'pdf')).toEqual([])
  })

  it('refuse un fichier inconnu, d’un autre visiteur ou d’un autre format', () => {
    const violation = [
      { propertyPath: 'contenu', message: 'Déposez un fichier du bon format avant de l’associer.' },
    ]
    expect(fileFieldViolations(null, { type: 'image', contenu: [UPLOADED] }, null)).toEqual(
      violation,
    )
    expect(fileFieldViolations(null, { type: 'image', contenu: [UPLOADED] }, 'pdf')).toEqual(
      violation,
    )
    // Un fichier de l'ancienne version ne peut pas être associé à une nouvelle trace
    expect(fileFieldViolations(null, { type: 'pdf', contenu: ['/fichiers/a.pdf'] }, null)).toEqual(
      violation,
    )
  })

  it('accepte une trace PDF dont le type et le fichier ne changent pas', () => {
    expect(
      fileFieldViolations(EXISTING, { type: 'pdf', contenu: ['/fichiers/etude-ux.pdf'] }, null),
    ).toEqual([])
  })

  it('accepte un brouillon image sans fichier, et une trace lien ou vidéo', () => {
    expect(fileFieldViolations(null, { type: 'image', contenu: [] }, null)).toEqual([])
    expect(
      fileFieldViolations(null, { type: 'lien', contenu: ['https://a.example'] }, null),
    ).toEqual([])
  })
})
