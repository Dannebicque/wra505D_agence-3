import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '#shared/types/utilisateur'
import PageConnexion from '~/pages/connexion.vue'

const ETUDIANTE: User = {
  '@id': '/api/users/1',
  '@type': 'User',
  username: 'etudiant',
  email: null,
  roles: ['ROLE_ETUDIANT'],
  etudiant: null,
  enseignant: null,
}

let loginStatus = 204
let isConnecte = false
// Connexions reçues par le faux serveur
let envois = 0
registerEndpoint('/api/login', {
  method: 'POST',
  handler: () => {
    envois++
    if (loginStatus !== 204) throw createError({ statusCode: loginStatus })
    isConnecte = true
    return null
  },
})
registerEndpoint('/api/me', () => {
  if (!isConnecte) throw createError({ statusCode: 401 })
  return ETUDIANTE
})

beforeEach(() => {
  loginStatus = 204
  isConnecte = false
  envois = 0
  const auth = useAuthStore()
  auth.user = null
  auth.isLoaded = false
})

async function remplirEtEnvoyer(page: Awaited<ReturnType<typeof mountSuspended>>) {
  await page.get('input[autocomplete="username"]').setValue('  etudiant ')
  await page.get('input[autocomplete="current-password"]').setValue('test')
  await page.get('form').trigger('submit')
  await flushPromises()
}

describe('page de connexion', () => {
  it('envoie la connexion, puis ouvre la page demandée', async () => {
    const page = await mountSuspended(PageConnexion, {
      route: '/connexion?redirect=/etudiant/traces',
    })
    await remplirEtEnvoyer(page)

    expect(envois).toBe(1)
    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/etudiant/traces'))
  })

  it.each([
    [401, 'Identifiant ou mot de passe incorrect.'],
    [403, 'Votre compte n’est pas encore activé'],
    [429, 'Trop de tentatives de connexion'],
    [500, 'Le serveur a rencontré une erreur'],
  ])('explique un refus %i dans la zone d’alerte', async (status, message) => {
    loginStatus = status
    const page = await mountSuspended(PageConnexion, { route: '/connexion' })
    await remplirEtEnvoyer(page)

    await vi.waitFor(() => expect(page.get('[role="alert"]').text()).toContain(message))
    expect(useRouter().currentRoute.value.path).toBe('/connexion')
  })

  it('ne contacte pas l’API tant qu’un champ manque', async () => {
    const page = await mountSuspended(PageConnexion, { route: '/connexion' })
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(envois).toBe(0)
    expect(page.text()).toContain('Saisissez votre identifiant universitaire.')
  })

  it('connecte au compte de démonstration choisi', async () => {
    const page = await mountSuspended(PageConnexion, { route: '/connexion' })
    const demo = page.findAll('button').find((b) => b.text().includes('Espace étudiant'))
    await demo!.trigger('click')

    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/etudiant'))
    expect(envois).toBe(1)
  })

  it('rend le focus à l’accès de démonstration quand la connexion échoue', async () => {
    loginStatus = 500
    const page = await mountSuspended(PageConnexion, {
      route: '/connexion',
      attachTo: document.body,
    })
    const demo = page.findAll('button').find((b) => b.text().includes('Espace étudiant'))!
    ;(demo.element as HTMLButtonElement).focus()
    await demo.trigger('click')

    await vi.waitFor(() => expect(page.get('[role="alert"]').text()).toContain('serveur'))
    await vi.waitFor(() => expect(document.activeElement).toBe(demo.element))
    page.unmount()
  })
})
