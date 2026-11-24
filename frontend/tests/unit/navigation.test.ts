import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ESPACE_LABELS,
  ESPACES,
  espaceFromPath,
  NAVIGATION,
  navigationGroups,
} from '../../app/utils/navigation'

const PAGES = fileURLToPath(new URL('../../app/pages', import.meta.url))

describe('espaceFromPath', () => {
  it.each([
    ['/etudiant', 'etudiant'],
    ['/etudiant/traces/12', 'etudiant'],
    ['/enseignant', 'enseignant'],
    ['/admin/', 'admin'],
  ])('rattache %s à l’espace %s', (path, espace) => {
    expect(espaceFromPath(path)).toBe(espace)
  })

  it.each(['/', '/etudiants', '/administration', '/portfolio/abc'])(
    'ne rattache %s à aucun espace',
    (path) => {
      expect(espaceFromPath(path)).toBeNull()
    },
  )
})

describe('NAVIGATION', () => {
  it('donne un libellé et au moins un lien à chaque espace', () => {
    expect(ESPACES).toEqual(['etudiant', 'enseignant', 'admin'])
    for (const espace of ESPACES) {
      expect(ESPACE_LABELS[espace].trim()).not.toBe('')
      expect(NAVIGATION[espace].length).toBeGreaterThan(0)
    }
  })

  it('ne propose que des liens de l’espace concerné', () => {
    for (const espace of ESPACES) {
      for (const item of NAVIGATION[espace]) {
        expect(espaceFromPath(item.to)).toBe(espace)
      }
    }
  })

  // Une fonctionnalité ajoute sa ligne de navigation en même temps que sa page
  it('ne propose aucun lien vers une page qui n’existe pas', () => {
    for (const espace of ESPACES) {
      for (const { to } of NAVIGATION[espace]) {
        const existe = existsSync(`${PAGES}${to}.vue`) || existsSync(`${PAGES}${to}/index.vue`)
        expect(existe, `page manquante pour ${to}`).toBe(true)
      }
    }
  })
})

describe('navigationGroups', () => {
  it('regroupe les entrées voisines de même groupe, dans l’ordre', () => {
    const groups = navigationGroups([
      { label: 'A', to: '/a' },
      { label: 'B', to: '/b', group: 'Travail' },
      { label: 'C', to: '/c', group: 'Travail' },
      { label: 'D', to: '/d', group: 'Suivi' },
    ])
    expect(groups.map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
      [undefined, ['A']],
      ['Travail', ['B', 'C']],
      ['Suivi', ['D']],
    ])
  })

  it('range les entrées du bas à la fin, même placées plus haut dans la liste', () => {
    const groups = navigationGroups([
      { label: 'Corbeille', to: '/x', pinnedBottom: true },
      { label: 'A', to: '/a' },
    ])
    expect(groups.map((g) => [g.pinnedBottom, g.items[0]!.label])).toEqual([
      [false, 'A'],
      [true, 'Corbeille'],
    ])
  })

  it('ne coupe pas un groupe quand une entrée du bas est placée au milieu', () => {
    const groups = navigationGroups([
      { label: 'A', to: '/a', group: 'T' },
      { label: 'X', to: '/x', pinnedBottom: true },
      { label: 'B', to: '/b', group: 'T' },
    ])
    expect(groups.map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
      ['T', ['A', 'B']],
      [undefined, ['X']],
    ])
  })

  it('met la corbeille de l’étudiant seule en bas de sa barre', () => {
    const groups = navigationGroups(NAVIGATION.etudiant)
    expect(groups.at(-1)).toMatchObject({ pinnedBottom: true, items: [{ label: 'Corbeille' }] })
    expect(groups.filter((g) => g.pinnedBottom)).toHaveLength(1)
  })
})
