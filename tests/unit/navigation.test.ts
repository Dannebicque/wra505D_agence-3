import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ESPACE_LABELS, ESPACES, espaceFromPath, NAVIGATION } from '../../app/utils/navigation'

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
