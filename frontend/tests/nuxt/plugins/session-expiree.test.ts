import { mockNuxtImport, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from '~/services/api'
import { simulerConnexion } from '../utils/auth'

// Session expirée pendant le travail (plugins/session-expiree.client.ts) : un 401 de l'API recharge
// l'application sur la connexion, avec la page en cours pour y revenir

const { reloadMock } = vi.hoisted(() => ({ reloadMock: vi.fn() }))
mockNuxtImport('reloadNuxtApp', () => reloadMock)

simulerConnexion()
registerEndpoint('/api/traces', () => {
  throw createError({ statusCode: 401 })
})

// Ordre voulu : le plugin ne renvoie qu'une fois par chargement de l'application (le premier test
// ne doit pas le déclencher)
describe('session expirée', () => {
  it('ne renvoie pas vers la connexion hors des espaces', async () => {
    await useRouter().push('/')
    await expect(apiFetch('/api/traces')).rejects.toMatchObject({ status: 401 })
    expect(reloadMock).not.toHaveBeenCalled()
  })

  it('recharge une seule fois sur la connexion depuis un espace, avec la page en cours', async () => {
    await useRouter().push('/etudiant/traces?statut=brouillon')
    // Plusieurs appels en cours répondent 401 en même temps : un seul rechargement
    await expect(apiFetch('/api/traces')).rejects.toMatchObject({ status: 401 })
    await expect(apiFetch('/api/traces')).rejects.toMatchObject({ status: 401 })
    expect(reloadMock).toHaveBeenCalledTimes(1)
    expect(reloadMock).toHaveBeenCalledWith({
      path: '/connexion?redirect=%2Fetudiant%2Ftraces%3Fstatut%3Dbrouillon',
      force: true,
    })
  })
})
