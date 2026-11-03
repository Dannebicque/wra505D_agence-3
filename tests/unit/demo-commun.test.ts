import { describe, expect, it } from 'vitest'
import { AIDE_GENERIQUE, AIDES, aideForPath, searchGroups } from '../../app/demo/commun'
import { NAVIGATION } from '../../app/utils/navigation'

describe('aideForPath', () => {
  it.each([
    ['/etudiant/traces', 'Déposer une trace'],
    ['/etudiant/traces/12', 'Déposer une trace'],
    ['/etudiant/portfolios/3/pages', 'Composer un portfolio'],
    ['/enseignant/evaluations', 'Évaluer une trace'],
    ['/etudiant', 'Votre tableau de bord'],
  ])('choisit l’aide la plus précise pour %s', (path, titre) => {
    expect(aideForPath(path).titre).toBe(titre)
  })

  it('retombe sur l’aide de l’espace pour une page sans aide propre', () => {
    expect(aideForPath('/enseignant/parametres')).toBe(AIDES['/enseignant'])
  })

  it.each(['/', '/connexion', '/etudiants', '/etudiant-traces'])(
    'donne l’aide générique hors des espaces (%s)',
    (path) => {
      expect(aideForPath(path)).toBe(AIDE_GENERIQUE)
    },
  )

  it('donne à chaque page de la navigation une aide qui lui est propre', () => {
    const paths = Object.values(NAVIGATION).flatMap((items) => items.map((item) => item.to))
    const missing = paths.filter((path) => !(path in AIDES))
    expect(missing).toEqual([])
  })

  it('donne à chaque aide un titre, une introduction et au moins une étape', () => {
    for (const aide of [AIDE_GENERIQUE, ...Object.values(AIDES)]) {
      expect(aide.titre.trim()).not.toBe('')
      expect(aide.intro.trim()).not.toBe('')
      expect(aide.etapes.length).toBeGreaterThan(0)
    }
  })
})

describe('searchGroups', () => {
  const groupIds = (espace: Parameters<typeof searchGroups>[0]) =>
    searchGroups(espace).map((group) => group.id)

  it('propose pages, traces et compétences à l’étudiant', () => {
    expect(groupIds('etudiant')).toEqual(['pages', 'traces', 'competences'])
  })

  it('propose aussi les étudiants à l’enseignant, et seulement à lui', () => {
    expect(groupIds('enseignant')).toContain('etudiants')
    expect(groupIds('etudiant')).not.toContain('etudiants')
    expect(groupIds('admin')).toEqual(['pages'])
  })

  it('reprend les pages de la navigation de l’espace', () => {
    const pages = searchGroups('etudiant').find((group) => group.id === 'pages')
    expect(pages?.items.map((item) => item.to)).toEqual(NAVIGATION.etudiant.map((item) => item.to))
  })

  it('mène chaque résultat dans l’espace courant', () => {
    for (const espace of ['etudiant', 'enseignant', 'admin'] as const) {
      for (const group of searchGroups(espace)) {
        for (const item of group.items) {
          expect(item.to.startsWith(`/${espace}`)).toBe(true)
          expect(item.label.trim()).not.toBe('')
        }
      }
    }
  })

  it('mène une trace de l’étudiant à sa page', () => {
    const traces = searchGroups('etudiant').find((group) => group.id === 'traces')
    expect(traces?.items.length).toBeGreaterThan(0)
    expect(traces?.items.every((item) => /^\/etudiant\/traces\/\d+$/.test(item.to))).toBe(true)
  })
})
