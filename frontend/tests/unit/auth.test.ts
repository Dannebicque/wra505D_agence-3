import { describe, expect, it } from 'vitest'
import {
  canAccessEspace,
  homeEspace,
  loginErrorMessage,
  pathAfterLogin,
  safeRedirect,
} from '../../app/utils/auth'

describe('canAccessEspace', () => {
  it('ouvre à chaque rôle son seul espace', () => {
    expect(canAccessEspace(['ROLE_ETUDIANT'], 'etudiant')).toBe(true)
    expect(canAccessEspace(['ROLE_ETUDIANT'], 'enseignant')).toBe(false)
    expect(canAccessEspace(['ROLE_ENSEIGNANT'], 'admin')).toBe(false)
    expect(canAccessEspace(['ROLE_ADMIN'], 'admin')).toBe(true)
  })

  it('cumule les espaces d’un utilisateur à plusieurs rôles', () => {
    const roles = ['ROLE_ENSEIGNANT', 'ROLE_ADMIN'] as const
    expect(canAccessEspace(roles, 'enseignant')).toBe(true)
    expect(canAccessEspace(roles, 'admin')).toBe(true)
  })
})

describe('homeEspace', () => {
  it('ouvre l’espace du rôle', () => {
    expect(homeEspace(['ROLE_ETUDIANT'])).toBe('etudiant')
    expect(homeEspace(['ROLE_ENSEIGNANT'])).toBe('enseignant')
    expect(homeEspace(['ROLE_ADMIN'])).toBe('admin')
  })

  it('préfère l’espace enseignant à l’administration', () => {
    expect(homeEspace(['ROLE_ADMIN', 'ROLE_ENSEIGNANT'])).toBe('enseignant')
  })

  it('renvoie null sans rôle connu', () => {
    expect(homeEspace([])).toBeNull()
  })
})

describe('safeRedirect', () => {
  it.each(['/etudiant', '/etudiant/traces/3?onglet=fichiers#haut', '/'])('garde %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([
    ['une autre origine', 'https://exemple.fr'],
    ['un chemin sans origine', '//exemple.fr'],
    ['une barre oblique inversée', '/\\exemple.fr'],
    ['un chemin relatif', 'etudiant'],
    ['un caractère de contrôle', '/\t/exemple.fr'],
    ['une valeur vide', ''],
    ['une liste (paramètre répété)', ['/etudiant']],
    ['une absence de valeur', undefined],
  ])('refuse %s', (_cas, value) => {
    expect(safeRedirect(value)).toBeNull()
  })
})

describe('pathAfterLogin', () => {
  it('reprend la page demandée dans un espace permis', () => {
    expect(pathAfterLogin(['ROLE_ETUDIANT'], '/etudiant/traces/4')).toBe('/etudiant/traces/4')
  })

  it('ouvre l’accueil de l’espace sans page demandée', () => {
    expect(pathAfterLogin(['ROLE_ENSEIGNANT'], undefined)).toBe('/enseignant')
  })

  it.each([
    ['un espace refusé', '/enseignant/evaluations'],
    ['la page de connexion (boucle)', '/connexion'],
    ['une page hors des espaces', '/'],
    ['une autre origine', '//exemple.fr/etudiant'],
  ])('ignore %s', (_cas, redirect) => {
    expect(pathAfterLogin(['ROLE_ETUDIANT'], redirect)).toBe('/etudiant')
  })

  it('renvoie null sans rôle connu', () => {
    expect(pathAfterLogin([], '/etudiant')).toBeNull()
  })
})

describe('loginErrorMessage', () => {
  it('explique chaque refus de connexion', () => {
    expect(loginErrorMessage(401, 'défaut')).toBe('Identifiant ou mot de passe incorrect.')
    expect(loginErrorMessage(403, 'défaut')).toMatch(/pas encore activé/)
    expect(loginErrorMessage(429, 'défaut')).toMatch(/Trop de tentatives/)
  })

  it('reprend le message général pour les autres erreurs', () => {
    expect(loginErrorMessage(0, 'Impossible de joindre le serveur.')).toBe(
      'Impossible de joindre le serveur.',
    )
  })
})
