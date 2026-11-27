import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '#shared/types/utilisateur'

// Garde des espaces (middleware/auth.global.ts), éprouvé par de vraies navigations du routeur

const compte = (roles: User['roles']): User => ({
  '@id': '/api/users/1',
  '@type': 'User',
  username: 'test',
  email: null,
  roles,
  etudiant: null,
  enseignant: null,
})

let me: User | null = null
let meStatus = 200
registerEndpoint('/api/me', () => {
  if (meStatus !== 200) throw createError({ statusCode: meStatus })
  if (!me) throw createError({ statusCode: 401 })
  return me
})

async function visit(path: string) {
  const router = useRouter()
  await router.push(path).catch(() => {})
  return router.currentRoute.value
}

beforeEach(async () => {
  me = null
  meStatus = 200
  const auth = useAuthStore()
  auth.user = null
  auth.profil = null
  auth.isLoaded = false
  await useRouter().push('/')
})

describe('garde des espaces', () => {
  it('envoie un visiteur non connecté vers la connexion, avec la page demandée', async () => {
    const route = await visit('/etudiant/traces?statut=brouillon')
    expect(route.path).toBe('/connexion')
    expect(route.query.redirect).toBe('/etudiant/traces?statut=brouillon')
  })

  it('laisse un visiteur non connecté sur les pages publiques', async () => {
    expect((await visit('/')).path).toBe('/')
    expect((await visit('/connexion')).path).toBe('/connexion')
  })

  it('ouvre son espace à l’utilisateur qui a le rôle', async () => {
    me = compte(['ROLE_ENSEIGNANT'])
    expect((await visit('/enseignant/evaluations')).path).toBe('/enseignant/evaluations')
  })

  it('renvoie vers son propre espace l’utilisateur qui n’a pas le rôle', async () => {
    me = compte(['ROLE_ETUDIANT'])
    expect((await visit('/enseignant')).path).toBe('/etudiant')
    expect((await visit('/admin')).path).toBe('/etudiant')
  })

  it('renvoie un utilisateur déjà connecté de la connexion vers la page demandée', async () => {
    me = compte(['ROLE_ETUDIANT'])
    expect((await visit('/connexion?redirect=/etudiant/cv')).path).toBe('/etudiant/cv')
    expect((await visit('/connexion?redirect=//exemple.fr')).path).toBe('/etudiant')
  })

  it('montre une erreur si l’API ne dit pas qui est connecté', async () => {
    meStatus = 500
    const route = await visit('/etudiant')
    expect(route.path).not.toBe('/etudiant')
    expect(useError().value).toMatchObject({ statusCode: 503 })
    clearError()
  })

  it('garde la page de connexion ouverte si l’API ne dit pas qui est connecté', async () => {
    meStatus = 500
    expect((await visit('/connexion')).path).toBe('/connexion')
    expect(useError().value).toBeFalsy()
  })
})
