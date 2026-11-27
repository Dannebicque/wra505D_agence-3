import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { User } from '#shared/types/utilisateur'
import { useTableauDeBordEtudiant } from '~/composables/useTableauDeBordEtudiant'

const COMPTE: User = {
  '@id': '/api/users/1',
  '@type': 'User',
  username: 'etudiant',
  email: null,
  roles: ['ROLE_ETUDIANT'],
  etudiant: null,
  enseignant: null,
}

// Ne doit jamais être appelée : sans fiche liée au compte, aucun identifiant n'est deviné
let fichesLues = 0
registerEndpoint('/api/etudiants/1', () => {
  fichesLues++
  return {}
})

async function mountComposable() {
  let result!: ReturnType<typeof useTableauDeBordEtudiant>
  await mountSuspended(
    defineComponent({
      setup() {
        result = useTableauDeBordEtudiant()
        return () => h('div')
      },
    }),
  )
  return result
}

describe('tableau de bord étudiant', () => {
  it('signale un compte sans fiche étudiant au lieu d’afficher un tableau vide', async () => {
    const auth = useAuthStore()
    auth.user = COMPTE
    auth.isLoaded = true

    const result = await mountComposable()

    await vi.waitFor(() => expect(result.status.value).toBe('error'))
    expect(result.error.value?.message).toBe('Aucune fiche étudiant n’est liée à votre compte.')
    expect(fichesLues).toBe(0)
  })
})
