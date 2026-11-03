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
  // Le téléversement arrive au lot C : aucun fichier ne peut être créé ou changé par l'API
  it('refuse de créer une trace image ou PDF', () => {
    expect(fileFieldViolations(null, { type: 'image', contenu: ['/fichiers/a.jpg'] })).toEqual([
      { propertyPath: 'type', message: 'Le dépôt de fichiers image ou PDF arrive prochainement.' },
    ])
  })

  it('accepte une trace PDF dont le type et le fichier ne changent pas', () => {
    expect(
      fileFieldViolations(EXISTING, { type: 'pdf', contenu: ['/fichiers/etude-ux.pdf'] }),
    ).toEqual([])
  })

  it('refuse de changer le fichier d’une trace PDF', () => {
    expect(
      fileFieldViolations(EXISTING, { type: 'pdf', contenu: ['javascript:alert(1)'] }),
    ).toHaveLength(1)
  })

  it('accepte une trace lien ou vidéo', () => {
    expect(fileFieldViolations(null, { type: 'lien', contenu: ['https://a.example'] })).toEqual([])
  })
})
