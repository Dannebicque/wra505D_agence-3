import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import type { Referentiel } from '#shared/types/referentiel'
import { getReferentiel, listReferentiels } from '~/services/referentiel'

const REFERENTIEL: Referentiel = {
  '@id': '/api/referentiels/1',
  '@type': 'Referentiel',
  libelle: 'Référentiel de test',
  departement: null,
  competences: [],
}

registerEndpoint('/api/referentiels', () => ({
  '@id': '/api/referentiels',
  '@type': 'Collection',
  totalItems: 1,
  member: [REFERENTIEL],
}))

registerEndpoint('/api/referentiels/1', () => REFERENTIEL)

describe('service du référentiel', () => {
  it('renvoie les référentiels de la collection', async () => {
    expect(await listReferentiels()).toEqual([REFERENTIEL])
  })

  it('renvoie un référentiel par son identifiant', async () => {
    expect(await getReferentiel(1)).toEqual(REFERENTIEL)
  })
})
