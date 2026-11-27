import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '#shared/types/utilisateur'
import { ApiError } from '~/services/errors'

const ETUDIANTE: User = {
  '@id': '/api/users/1',
  '@type': 'User',
  username: 'etudiant',
  email: 'lea@exemple.fr',
  roles: ['ROLE_ETUDIANT'],
  etudiant: '/api/etudiants/7',
  enseignant: null,
}

// État du faux serveur, modifié par chaque test
let me: User | null = null
let meStatus = 200
let profilStatus = 200
let loginStatus = 204
const requetes: string[] = []

registerEndpoint('/api/me', () => {
  requetes.push('me')
  if (meStatus !== 200) throw createError({ statusCode: meStatus })
  if (!me) throw createError({ statusCode: 401 })
  return me
})
registerEndpoint('/api/etudiants/7', () => {
  if (profilStatus !== 200) throw createError({ statusCode: profilStatus })
  return { '@id': '/api/etudiants/7', '@type': 'Etudiant', prenom: 'Léa', nom: 'Martin' }
})
registerEndpoint('/api/login', {
  method: 'POST',
  handler: () => {
    if (loginStatus !== 204) throw createError({ statusCode: loginStatus })
    me = ETUDIANTE
    return null
  },
})
registerEndpoint('/api/logout', { method: 'POST', handler: () => null })

beforeEach(() => {
  me = null
  meStatus = 200
  profilStatus = 200
  loginStatus = 204
  requetes.length = 0
  const auth = useAuthStore()
  auth.user = null
  auth.profil = null
  auth.isLoaded = false
})

describe('useAuthStore', () => {
  it('lit l’utilisateur connecté et le nom de sa fiche', async () => {
    me = ETUDIANTE
    const auth = useAuthStore()
    await auth.ensureLoaded()

    expect(auth.isLoggedIn).toBe(true)
    expect(auth.roles).toEqual(['ROLE_ETUDIANT'])
    expect(auth.home).toBe('etudiant')
    expect(auth.displayName).toBe('Léa Martin')
  })

  it('ne relit pas l’utilisateur une fois chargé', async () => {
    me = ETUDIANTE
    const auth = useAuthStore()
    await auth.ensureLoaded()
    await auth.ensureLoaded()
    expect(requetes).toEqual(['me'])
  })

  it('comprend un 401 comme « personne n’est connecté »', async () => {
    const auth = useAuthStore()
    await auth.ensureLoaded()

    expect(auth.isLoaded).toBe(true)
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.home).toBeNull()
  })

  it('laisse remonter toute autre erreur, sans se croire chargé', async () => {
    meStatus = 500
    const auth = useAuthStore()

    await expect(auth.ensureLoaded()).rejects.toBeInstanceOf(ApiError)
    expect(auth.isLoaded).toBe(false)
  })

  it('affiche l’identifiant de connexion si la fiche est illisible', async () => {
    me = ETUDIANTE
    profilStatus = 500
    const auth = useAuthStore()
    await auth.ensureLoaded()

    expect(auth.isLoggedIn).toBe(true)
    expect(auth.displayName).toBe('etudiant')
  })

  it('se connecte puis lit l’utilisateur', async () => {
    const auth = useAuthStore()
    await auth.login({ username: 'etudiant', password: 'test' })

    expect(auth.isLoggedIn).toBe(true)
    expect(auth.displayName).toBe('Léa Martin')
  })

  it('relance le refus de connexion avec son code', async () => {
    loginStatus = 429
    const auth = useAuthStore()

    await expect(auth.login({ username: 'etudiant', password: 'x' })).rejects.toMatchObject({
      status: 429,
    })
    expect(auth.isLoggedIn).toBe(false)
  })

  it('oublie l’utilisateur à la déconnexion', async () => {
    me = ETUDIANTE
    const auth = useAuthStore()
    await auth.ensureLoaded()
    await auth.logout()

    expect(auth.isLoggedIn).toBe(false)
    expect(auth.displayName).toBe('')
  })
})
