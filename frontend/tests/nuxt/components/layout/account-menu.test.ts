import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountMenu from '~/components/layout/AccountMenu.vue'

const { reloadMock } = vi.hoisted(() => ({ reloadMock: vi.fn() }))
mockNuxtImport('reloadNuxtApp', () => reloadMock)

let logoutStatus = 204
let deconnexions = 0
registerEndpoint('/api/logout', {
  method: 'POST',
  handler: () => {
    deconnexions++
    if (logoutStatus !== 204) throw createError({ statusCode: logoutStatus })
    return null
  },
})

function connecter() {
  const auth = useAuthStore()
  auth.user = {
    '@id': '/api/users/2',
    '@type': 'User',
    username: 'enseignant',
    email: null,
    roles: ['ROLE_ENSEIGNANT'],
    etudiant: null,
    enseignant: '/api/enseignants/1',
  }
  auth.profil = {
    '@id': '/api/enseignants/1',
    '@type': 'Enseignant',
    prenom: 'Sophie',
    nom: 'Durand',
    mailUniv: 'sophie.durand@univ.example',
    departements: [],
    user: '/api/users/2',
  }
  auth.isLoaded = true
}

beforeEach(() => {
  logoutStatus = 204
  deconnexions = 0
  reloadMock.mockReset()
})

describe('menu du compte', () => {
  it('nomme l’utilisateur connecté et propose la déconnexion', async () => {
    connecter()
    const menu = await mountSuspended(AccountMenu)

    expect(menu.text()).toContain('Connecté en tant que')
    expect(menu.text()).toContain('Sophie Durand')
    expect(menu.find('button[aria-label="Se déconnecter"]').exists()).toBe(true)
  })

  it('ferme la session puis recharge l’application sur la connexion', async () => {
    connecter()
    const menu = await mountSuspended(AccountMenu)
    await menu.get('button[aria-label="Se déconnecter"]').trigger('click')
    await flushPromises()

    expect(deconnexions).toBe(1)
    expect(reloadMock).toHaveBeenCalledWith({ path: '/connexion', force: true })
    expect(useAuthStore().isLoggedIn).toBe(false)
  })

  it('reste connecté si la déconnexion échoue', async () => {
    logoutStatus = 500
    connecter()
    const menu = await mountSuspended(AccountMenu)
    await menu.get('button[aria-label="Se déconnecter"]').trigger('click')
    await flushPromises()

    expect(reloadMock).not.toHaveBeenCalled()
    expect(useAuthStore().isLoggedIn).toBe(true)
  })

  it('n’affiche ni nom ni déconnexion sans utilisateur', async () => {
    const auth = useAuthStore()
    auth.user = null
    auth.profil = null
    const menu = await mountSuspended(AccountMenu)

    expect(menu.find('button[aria-label="Se déconnecter"]').exists()).toBe(false)
  })
})
