import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { getEtudiant } from '~/services/etudiant'
import { listTraces } from '~/services/trace'
import { listValidations } from '~/services/validation'

const ETUDIANT = { '@id': '/api/etudiants/1', '@type': 'Etudiant', prenom: 'Léa' }
const TRACE = { '@id': '/api/traces/1', '@type': 'Trace', titre: 'Refonte' }
const VALIDATION = { '@id': '/api/validations/1', '@type': 'Validation', etat: 3 }

const collection = (path: string, member: unknown[]) => ({
  '@id': path,
  '@type': 'Collection',
  totalItems: member.length,
  member,
})

registerEndpoint('/api/etudiants/1', () => ETUDIANT)
registerEndpoint('/api/traces', () => collection('/api/traces', [TRACE]))
registerEndpoint('/api/validations', () => collection('/api/validations', [VALIDATION]))

describe('services du tableau de bord', () => {
  it('renvoie un étudiant par son identifiant', async () => {
    expect(await getEtudiant(1)).toEqual(ETUDIANT)
  })

  it('renvoie les traces de la collection', async () => {
    expect(await listTraces()).toEqual([TRACE])
  })

  it('renvoie les validations de la collection', async () => {
    expect(await listValidations()).toEqual([VALIDATION])
  })
})
