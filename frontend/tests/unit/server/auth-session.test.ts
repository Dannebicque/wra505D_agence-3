import { describe, expect, it } from 'vitest'
import { COMPTES, compteByUsername } from '../../../server/data/comptes'
import {
  createSessionStore,
  isApiRequest,
  isPublicApiRequest,
} from '../../../server/utils/auth-session'

describe('createSessionStore', () => {
  it('retrouve l’utilisateur d’une session ouverte, puis l’oublie à sa fermeture', () => {
    const store = createSessionStore()
    const id = store.open('etudiant')
    expect(store.username(id)).toBe('etudiant')
    store.close(id)
    expect(store.username(id)).toBeUndefined()
  })

  it('donne un identifiant différent à chaque connexion', () => {
    const store = createSessionStore()
    expect(store.open('etudiant')).not.toBe(store.open('etudiant'))
  })

  it('ignore un cookie absent ou inconnu', () => {
    const store = createSessionStore()
    expect(store.username(undefined)).toBeUndefined()
    expect(store.username('inconnu')).toBeUndefined()
    expect(() => store.close(undefined)).not.toThrow()
  })

  it('oublie la session la plus ancienne au-delà de la limite', () => {
    const store = createSessionStore({ maxSessions: 2 })
    const first = store.open('etudiant')
    const second = store.open('enseignant')
    const third = store.open('admin')
    expect(store.username(first)).toBeUndefined()
    expect(store.username(second)).toBe('enseignant')
    expect(store.username(third)).toBe('admin')
  })
})

describe('isPublicApiRequest', () => {
  it.each([
    ['POST', '/api/login'],
    ['POST', '/api/logout'],
    ['GET', '/api/portfolios/12/public'],
    ['GET', '/api/fichiers/0b6f1c1e-6a0e-4d5f-9c1b-2f3e4d5c6b7a'],
    ['GET', '/api/fichiers/0b6f1c1e-6a0e-4d5f-9c1b-2f3e4d5c6b7a?telechargement=1'],
  ])('laisse passer %s %s sans connexion', (method, path) => {
    expect(isPublicApiRequest(path, method)).toBe(true)
  })

  it.each([
    ['GET', '/api/me'],
    ['GET', '/api/traces'],
    ['POST', '/api/fichiers'],
    ['DELETE', '/api/portfolios/12/public'],
    ['GET', '/api/login/autre'],
  ])('exige une connexion pour %s %s', (method, path) => {
    expect(isPublicApiRequest(path, method)).toBe(false)
  })
})

describe('isApiRequest', () => {
  it('distingue l’API des pages du front', () => {
    expect(isApiRequest('/api/traces?page=2')).toBe(true)
    expect(isApiRequest('/api')).toBe(true)
    expect(isApiRequest('/etudiant')).toBe(false)
    expect(isApiRequest('/apidoc')).toBe(false)
  })

  it('laisse les icônes du front hors du contrôle de connexion', () => {
    expect(isApiRequest('/api/_nuxt_icon/lucide.json?icons=log-out')).toBe(false)
    expect(isApiRequest('/api/_nuxt_icon')).toBe(false)
  })
})

describe('comptes de démonstration', () => {
  it('reprennent les identifiants des fixtures de l’API, un par espace', () => {
    expect(COMPTES.map((compte) => compte.user.username)).toEqual([
      'etudiant',
      'enseignant',
      'admin',
    ])
    expect(compteByUsername('enseignant')?.user.enseignant).toBe('/api/enseignants/1')
    expect(compteByUsername('inconnu')).toBeUndefined()
  })
})
